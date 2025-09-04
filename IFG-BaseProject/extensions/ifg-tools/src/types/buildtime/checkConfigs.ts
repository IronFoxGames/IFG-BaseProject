import { exit } from 'process';
import { check, expandError } from './checker';

let errors = 0;

check('../../', (path, schema, iter) => {
    errors++;
    console.log(path, iter ? JSON.stringify(expandError(iter), null, 2) : '');
});

exit(errors);
