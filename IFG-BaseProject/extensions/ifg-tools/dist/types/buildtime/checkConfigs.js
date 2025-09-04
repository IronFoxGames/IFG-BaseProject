"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("process");
const checker_1 = require("./checker");
let errors = 0;
(0, checker_1.check)('../../', (path, schema, iter) => {
    errors++;
    console.log(path, iter ? JSON.stringify((0, checker_1.expandError)(iter), null, 2) : '');
});
(0, process_1.exit)(errors);
