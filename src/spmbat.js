#!/usr/bin/env node
// -*- js -*-

//spm build
var fs = require('fs'),
    util = require('util'),
    path = require('path'),
    child_process = require('child_process'),
    root_path = process.argv[1];
    
    var VERSION = '0.1.1';

    
    var exec = child_process.exec,
        spawn = child_process.spawn,
        dashed = '------------------------\n',
        CHECK_FILE = 'package.json';
    
    var curPath = process.argv[2] || getDir(root_path);
    console.log(root_path, curPath);
    
    function hasFile (dir, name) {
        var files = fs.readdirSync(dir);
        for (var i = 0; i < files.length; i ++) {
            if (files[i] === name) {
                return true;
            }
        }
        return false;
    }
    function checkPackageJson(name) {
        name = name || CHECK_FILE;
        return (fs.existsSync(name) || hasFile(curPath, name));
    }
    
    function getDir(p) {
        p = p || curPath;
        return fs.lstatSync(p).isDirectory() ? p : path.dirname(p);
    }
    function cdDir (p) {
        curPath = path.resolve(p);
        curPath = getDir(curPath);
    }
    function runCmds (cmds, dir) {
        dir = dir || curPath;
        var cmd;
        if (cmds.length) {
            cmd = cmds.shift();
            exec(cmd, {
                cwd: dir
            }, function (error, stdout, stderr) {
                stdout && console.log('stdout: ' + stdout);
                stderr && console.log('stderr: ' + stderr);
                if (error !== null) {
                  console.log('exec error: ' + error);
                } else {
                    runCmds(cmds);
                }
                
            });
        }
    }
    function spm () {
        runCmds(['spm build -compiler=clouser']);
    }
    function getAllDistDirs (dir) {
        var ret = [];
        if (!fs.lstatSync(dir).isDirectory()) {
            return ret;
        }
        
        var files = fs.readdirSync(dir);
        
        for (var i = 0; i < files.length; i ++) {
            var file = files[i];
            if (file == '.git') continue;
            
            var newPath = curPath + '/' + file;
            if (fs.lstatSync(newPath).isDirectory()) {
                ret.push(newPath);
                ret = ret.concat(getAllDistDirs(newPath))
            }
        }
        
        return ret;
    }
    
    function getAllDistFiles (dir) {
        var ret = [],
            files = fs.readdirSync(dir);
        files.forEach(function (file) {
            var newPath = dir + '/' + file;
            if (!fs.lstatSync(newPath).isDirectory()) {
                (file == CHECK_FILE) && ret.push(newPath);
            } else {
                ret = ret.concat(getAllDistFiles(newPath));
            }
        })
        
        return ret;
    }

    function main (args) {
        console.log('args: ' + args);
        
        if (args && args instanceof Array){
            while (args.length > 0) {
                var v = args.shift();
                switch(v) {
                    case '-v':
                    case '--version':
                        util.print('version ' + VERSION);
                        process.exit(0);
                    default:
                        break;
                }
            }
        }
        
        var files = getAllDistFiles(curPath);
        files.forEach(function (file) {
            var dir = getDir(file);
            runCmds(['spm build -compiler=clouser'], dir);
        })
    }
    
    if (require.main === module) {
        main(process.argv.slice(2));
    } else {
        module.exports = main;
    }
    
    
