import {readFileSync} from 'fs-extra';
import { join } from 'path';
import { authenticate } from '@google-cloud/local-auth';
import {google, Auth, drive_v3} from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs/promises';
import {DialogueJsonConverter} from "../../narrative/DialogueJsonConverter";
import {readFile} from "fs/promises";
import {DialogueSet} from "../../narrative/DialogueSet";

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = join(__dirname, '../../../../../temp/token.json');
const CREDENTIALS_PATH = join(__dirname, '../../../../../temp/credentials.json');
const FOLDER_NAME = "Narrative Scripts";

module.exports = Editor.Panel.define({
    listeners: {
        show() { },
        hide() { },
    },
    template: readFileSync(join(__dirname, '../../../static/template/dialogue-importer/index.html'), 'utf-8'),
    style: readFileSync(join(__dirname, '../../../static/style/dialogue-importer/index.css'), 'utf-8'),
    $: {
        folderNameInput: '#folderNameInput',
        importDialogueButton: '#importDialogueButton',
        authButton: '#authButton',
        authStatus: '#authStatus',
        leftScrollableList: '#left-scrollable-list',
        rightScrollableList: '#right-scrollable-list',
        syncSelectedButton: '#syncSelectedButton',
        syncAllButton: '#syncAllButton',
    },
    methods: {
        async authorize(): Promise<OAuth2Client> {
            let client = await this.loadSavedCredentialsIfExist();
            if (client) {
                return client;
            }
            client = await authenticate({
                scopes: SCOPES,
                keyfilePath: CREDENTIALS_PATH,
            }) as OAuth2Client;
            if (client.credentials) {
                await this.saveCredentials(client);
            }
            return client;
        },
        async saveCredentials(client: OAuth2Client): Promise<void> {
            const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
            const keys = JSON.parse(content);
            const key = keys.installed || keys.web;
            const payload = JSON.stringify({
                type: 'authorized_user',
                client_id: key.client_id,
                client_secret: key.client_secret,
                refresh_token: client.credentials.refresh_token,
            });
            await fs.writeFile(TOKEN_PATH, payload);
        },
        async loadSavedCredentialsIfExist(): Promise<OAuth2Client | null> {
            try {
                const content = await fs.readFile(TOKEN_PATH, 'utf-8');
                const credentials = JSON.parse(content);
                return google.auth.fromJSON(credentials) as OAuth2Client;
            } catch (err) {
                console.error("Error loading saved credentials:", err);
                return null;
            }
        },
        async fetchFilesFromDrive(authClient: OAuth2Client, folderName : string) {
            const drive = google.drive({ version: 'v3', auth: authClient });
            
            const res = await drive.files.list({
                q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder'`,
                fields: 'files(id, name)',
            });

            const folder = res.data.files?.[0];

            if (!folder) 
            {
                console.log('Folder not found.');
                return;
            }

            //Get Files in folder
            const filesRes = await drive.files.list({
                q: `'${folder.id}' in parents`,
                fields: 'files(id, name, mimeType)',
            });
            
            const files = filesRes.data.files;
            if (!files || files.length === 0) {
                console.log('No files found in the folder.');
                return;
            }
            
            const fileNames : string[] = [];
            
            files.forEach(file => 
            {
                if (file.name) 
                {
                    fileNames.push(file.name);
                }
            });
            
            const jsonList = await this.populateLeftList(authClient, files);
            await this.populateRightList(fileNames);
            
            return jsonList;
        },
        async getJsonsFromCSV(authClient : OAuth2Client, fileID : string, fileName: string)
        {
            const drive = google.drive({ version: 'v3', auth: authClient });

            try {
                const res = await drive.files.export(
                    {
                        fileId: fileID,
                        mimeType: 'text/csv',
                    },
                    { responseType: 'text' }
                );

                const csvContent = res.data;
                let content : string = csvContent as string;
                content += "\n";

                const dialogueJsonConverter = new DialogueJsonConverter();
                return dialogueJsonConverter.ParseJsonFiles(content, fileName);
            }
            catch (err)
            {
                console.error('Error exporting file:', err);
                throw err;
            }
        },
        async populateLeftList(authClient : OAuth2Client, files: drive_v3.Schema$File[]) {
            
            const listContainer = this.$.leftScrollableList;
            listContainer!.innerHTML = '';
            
            files = files.filter(f => f.mimeType === 'application/vnd.google-apps.spreadsheet');
            
            const totalJsonList : {name: string, json: string}[] = [];
            
            for (const file of files) 
            {
                const index = files.indexOf(file);
                let jsonList : {name: string, json: string}[] = [];
                const childCheckboxes: HTMLInputElement[] = [];
                
                if (file.id && file.name)
                {
                    jsonList = await this.getJsonsFromCSV(authClient, file.id, file.name);
                    totalJsonList.push(...jsonList);
                }
                
                const listItem = document.createElement('div');
                listItem.classList.add('list-item');

                const listHeader = document.createElement('div');
                listHeader.classList.add('list-header');

                const listLeft = document.createElement('div');
                listLeft.classList.add('list-item-left');
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `checkbox${index}`;
                
                const fileName = document.createElement('div');
                fileName.innerHTML = file.name || '';
                fileName.classList.add('file-entry');
                fileName.id = `fileName${index}`;

                const dropdownButton = document.createElement('button');
                dropdownButton.innerHTML = '▼';
                dropdownButton.classList.add('dropdown-button');
                dropdownButton.setAttribute('aria-expanded', 'false');

                dropdownButton.addEventListener('click', () => 
                {
                    this.toggleDropDownMenu(index);
                });
                
                const subList = document.createElement('ul');
                subList.classList.add('sub-file-list');
                subList.style.display = 'none';

                jsonList.forEach(json => {
                    const subItem = document.createElement('li');

                    const listLeft = document.createElement('div');
                    listLeft.classList.add('list-item-left');

                    const jsonFileName = document.createElement('div');
                    jsonFileName.textContent = json.name || '';
                    jsonFileName.classList.add('file-entry');

                    const jsonCheckbox = document.createElement('input');
                    jsonCheckbox.type = 'checkbox';
                    jsonCheckbox.id = `checkbox${index}`;
                    childCheckboxes.push(jsonCheckbox);
                    
                    listLeft.appendChild(jsonCheckbox);
                    listLeft.appendChild(jsonFileName);
                    
                    subItem.appendChild(listLeft);
                    
                    subList.appendChild(subItem);
                });
                
                checkbox.addEventListener('change', ()=>
                {
                    const isChecked = checkbox.checked;

                    childCheckboxes.forEach(cb => 
                    {
                        cb.checked = isChecked;
                    });
                });

                listLeft.appendChild(dropdownButton);
                listLeft.appendChild(checkbox);
                listLeft.appendChild(fileName);
                
                listHeader.appendChild(listLeft);
                
                listItem.appendChild(listHeader);
                listItem.appendChild(subList);
                
                listContainer!.appendChild(listItem);
            }
            
            return totalJsonList;
        },
        async populateRightList(fileNames : string[]) {
            this.$.rightScrollableList!.innerHTML = '';
            
            const jsonFiles = await this.getAllExistingJsonFilesInFolder();
            
            fileNames.forEach((fileName, index) => 
            {
                const listItem = document.createElement('div');
                listItem.classList.add('list-item');

                const listHeader = document.createElement('div');
                listHeader.classList.add('list-header');

                const listLeft = document.createElement('div');
                listLeft.classList.add('list-item-left');

                const fileNameText = document.createElement('div');
                fileNameText.innerHTML = fileName || '';
                fileNameText.classList.add('file-entry');

                const dropdownButton = document.createElement('button');
                dropdownButton.innerHTML = '▼';
                dropdownButton.classList.add('dropdown-button');
                dropdownButton.setAttribute('aria-expanded', 'false');

                dropdownButton.addEventListener('click', () =>
                {
                    this.toggleDropDownMenu(index);
                });

                const subList = document.createElement('ul');
                subList.classList.add('sub-file-list');
                subList.style.display = 'none';
                
                const filesToList : {name: string, url: string, content: string}[] = [];
                
                jsonFiles.forEach(file =>
                {
                    let dialogueSet : DialogueSet = new DialogueSet();
                    dialogueSet.initFromString(file!.content);
                    
                    if (dialogueSet.sourceFile)
                    {
                        if (fileName == dialogueSet.sourceFile && file)
                        {
                            filesToList.push(file);
                        }
                    }
                });
                
                filesToList.forEach(file => 
                {
                    const subItem = document.createElement('li');
                    subItem.classList.add('file-entry');
                    subItem.textContent = file!.name;
                    
                    subList.appendChild(subItem);
                });

                listLeft.appendChild(dropdownButton);
                listLeft.appendChild(fileNameText);

                listHeader.appendChild(listLeft);
                
                if (subList.children.length > 0) 
                {
                    listItem.appendChild(listHeader);
                    listItem.appendChild(subList);
                }

                this.$.rightScrollableList!.appendChild(listItem);
            });
        },
        toggleDropDownMenu(listIndex: number)
        {
            const leftElement = this.$.leftScrollableList!.children[listIndex];
            const rightElement = this.$.rightScrollableList!.children[listIndex];

            let leftDropdownButton : Element | null = null;
            let leftSubList : HTMLUListElement | null = null;
            let rightDropdownButton : Element | null = null;
            let rightSubList : HTMLUListElement | null = null;
            
            if (leftElement.children && leftElement.children.length > 0)
            {
                leftDropdownButton = leftElement.children[0].children[0].children[0];
                leftSubList = leftElement!.children[1] as HTMLUListElement;
            }
            
            if (rightElement.children && rightElement.children.length > 0) {
                rightDropdownButton = rightElement.children[0].children[0].children[0];
                rightSubList = rightElement!.children[1] as HTMLUListElement;
            }
            
            let isExpanded: boolean = false;
            
            if (leftSubList && leftDropdownButton) {
                isExpanded = leftDropdownButton.getAttribute('aria-expanded') === 'true';
                leftSubList.style.display = isExpanded ? 'none' : 'block';
                leftDropdownButton.setAttribute('aria-expanded', (!isExpanded).toString());
                leftDropdownButton.innerHTML = isExpanded ? '▼' : '▲';
            }
            
            if (rightSubList && rightDropdownButton) {
                rightSubList.style.display = isExpanded ? 'none' : 'block';
                rightDropdownButton.setAttribute('aria-expanded', (!isExpanded).toString());
                rightDropdownButton.innerHTML = isExpanded ? '▼' : '▲';
            }
        },
        async getAllExistingJsonFilesInFolder()
        {
            const pattern = `db://assets/resources/dialogueSets/**/*.json`;
            try 
            {
                const assets = await Editor.Message.request('asset-db', 'query-assets', { pattern });
                
                const jsonFilesWithContent = await Promise.all(
                    assets.map(async (asset) => 
                    {
                        try 
                        {
                            const filePath = await Editor.Message.request('asset-db', 'query-path', asset.url);
                            let content: string = "";
                            
                            if (filePath) 
                            {
                                content = await readFile(filePath, 'utf-8');
                            }

                            return{
                                name: asset.name,
                                url: asset.url,
                                content: JSON.parse(JSON.stringify(content)),
                            };
                        } 
                        catch (err)
                        {
                            console.error(`Failed to load content for ${asset.url}:`, err);
                            return null;
                        }
                    })
                );
                
                return jsonFilesWithContent.filter((file) => file !== null);
            } 
            catch (err)
            {
                console.error('Error querying JSON assets:', err);
                throw err;
            }
        },
        async syncFiles(files : {name: string, json: string}[])
        {
            if (files) 
            {
                const dialogueJsonConverter = new DialogueJsonConverter();
                await dialogueJsonConverter.SaveJsonsAsDialogueSets(files);
            }
        },
    },
    async ready() 
    {
        let client : OAuth2Client | null = null;
        let foundFiles : {name: string, json: string}[] = [];
        
        this.$.authButton!.addEventListener('confirm', (event) =>
        {
            this.authorize().then((fetchedClient) => 
            {
                 if (fetchedClient)
                 {
                     client = fetchedClient;
                     this.$.authStatus!.innerHTML = "Auth Successful!";
                     this.$.authStatus!.style.color = 'green';
                 }
                 else 
                 {
                     this.$.authStatus!.innerHTML = "Auth Failed.";
                     this.$.authStatus!.style.color = 'red';
                 }
            });
        });
        
        this.$.importDialogueButton!.addEventListener('confirm', (event) => 
        {
            if (client) 
            {
                this.fetchFilesFromDrive(client, FOLDER_NAME).then((files) =>
                {
                    if (files)
                    {
                        foundFiles = files;
                    }
                });
            }
        });

        this.$.syncSelectedButton!.addEventListener('confirm', () => {
            if (foundFiles && client)
            {
                let filesToSync : {name: string, json: string}[] = [];
                const listContainer = this.$.leftScrollableList;
                
                for (let i = 0; i < listContainer!.children.length; i++) 
                {
                    //loop through each sublist item for each file in the list
                    for (let j = 0; j < listContainer!.children[i].children[1].children.length; j++) 
                    {
                        const child = listContainer!.children[i].children[1].children[j];
                        const checkboxChild = child!.children[0]!.children[0];
                        const isChecked = (checkboxChild as HTMLInputElement).checked;

                        if (isChecked)
                        {
                            const matchingFile = foundFiles.find(file => file.name == child!.textContent);

                            if (matchingFile)
                            {
                                filesToSync.push(matchingFile);
                            }
                        }
                    }
                }
                
                this.syncFiles(filesToSync);
            }
        });

        this.$.syncAllButton!.addEventListener('confirm', () => 
        {
            if (foundFiles && client)
            {
                this.syncFiles(foundFiles);
            }
        });
        
    },
    beforeClose() { },
    close() { },
});
