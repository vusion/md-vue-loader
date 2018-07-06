/**
 * all above code from
 * https://github.com/renanhangai/virtual-file-loader/blob/master/src/fs-patch.js
 */

const path = require('path');

const NS = __filename;

/**
 * Patch the file system
 */
function patch(fs) {
    if (fs[NS])
        return;

    const virtualFS = {
        files: {},
        add(options) {
            const file = path.resolve(options.path);
            if (virtualFS.files[file] && virtualFS.files[file].content.equals(options.content)) {
                return;
            }
            virtualFS.files[file] = {
                path: file,
                content: options.content,
            };
        },
    };
    fs[NS] = virtualFS;

    createPatchFn(fs, 'readFile', function (orig, args, file, encoding, cb) {
        const rfile = path.resolve(file);
        const vfile = virtualFS.files[rfile];
        if (vfile) {
            if (typeof encoding === 'function') {
                cb = encoding;
                encoding = null;
            }

            let content = vfile.content;
            if (encoding !== null)
                content = content.toString(encoding);

            cb(null, content);
            return;
        }
        return orig.apply(this, args);
    });
    createPatchFn(fs, 'readFileSync', function (orig, args, file, encoding) {
        const rfile = path.resolve(file);
        const vfile = virtualFS.files[rfile];
        if (vfile) {
            let content = vfile.content;
            if (encoding !== null)
                content = content.toString(encoding);
            return content;
        }
        return orig.apply(this, args);
    });

    createPatchFn(fs, 'stat', function (orig, args, p, cb) {
        const rp = path.resolve(p);
        const vfile = virtualFS.files[rp];
        if (vfile) {
            const vstat = {
                dev: 8675309,
                nlink: 1,
                uid: 501,
                gid: 20,
                rdev: 0,
                blksize: 4096,
                ino: 44700000,
                mode: 33188,
                size: vfile.content.length,
                isFile: function isFile() {
                    return true;
                },
                isDirectory: function isDirectory() {
                    return false;
                },
                isBlockDevice: function isBlockDevice() {
                    return false;
                },
                isCharacterDevice: function isCharacterDevice() {
                    return false;
                },
                isSymbolicLink: function isSymbolicLink() {
                    return false;
                },
                isFIFO: function isFIFO() {
                    return false;
                },
                isSocket: function isSocket() {
                    return false;
                },
            };
            cb(null, vstat);
            return;
        }
        return orig.apply(this, args);
    });
    createPatchFn(fs, 'statSync', function (orig, args, p) {
        const rp = path.resolve(p);
        const vfile = virtualFS.files[rp];
        if (vfile) {
            const vstat = {
                dev: 8675309,
                nlink: 1,
                uid: 501,
                gid: 20,
                rdev: 0,
                blksize: 4096,
                ino: 44700000,
                mode: 33188,
                size: vfile.content.length,
                isFile: function isFile() {
                    return true;
                },
                isDirectory: function isDirectory() {
                    return false;
                },
                isBlockDevice: function isBlockDevice() {
                    return false;
                },
                isCharacterDevice: function isCharacterDevice() {
                    return false;
                },
                isSymbolicLink: function isSymbolicLink() {
                    return false;
                },
                isFIFO: function isFIFO() {
                    return false;
                },
                isSocket: function isSocket() {
                    return false;
                },
            };
            return vstat;
        }
        return orig.apply(this, args);
    });
}

function add(fs, options) {
    patch(fs);
    fs[NS].add(options);
}

function createPatchFn(obj, name, fn) {
    const origin = obj[name];
    obj[name] = function (...args) {
        return fn.apply(this, [origin, args].concat(args));
    };
}

exports.createFile = function (fs, path, content, cb) {
    add(fs, {
        path,
        content: Buffer.from(content),
    });
    cb && cb();
};
