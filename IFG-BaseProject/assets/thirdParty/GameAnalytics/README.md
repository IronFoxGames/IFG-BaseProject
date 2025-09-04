This is a modified version of the files found at https://github.com/GameAnalytics/GA-SDK-JAVASCRIPT/tree/9e5021a3bac5295db7b2d552c8232d4e7c487f25/dist

They are modified because the ts definitions are broken.

The modifications are only to GameAnalytics.d.ts and they consist of:

- Moving the exported module containing the enum definitions (originally line 133 in GameAnalytics.d.ts) to its own file
- Changing the module to a namespace and exporting all the enums within