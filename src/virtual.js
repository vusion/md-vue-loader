/**
 * all above code from
 * https://github.com/renanhangai/virtual-file-loader/blob/master/src/fs-patch.js
 */

const path = require('path');

const NS = __filename;

/**
 * mock file system stats
 */
class Stats {
    constructor(content) {
        const createDate = new Date();
        Object.assign(this, {
            ino: 48064969,
            mode: 33188,
            nlink: 1,
            uid: 85,
            gid: 100,
            rdev: 0,
            size: content.length,
            blksize: 4096,
            blocks: 8,
            atimeMs: createDate.getTime(),
            mtimeMs: createDate.getTime(),
            ctimeMs: createDate.getTime(),
            birthtimeMs: createDate.getTime(),
            atime: createDate,
            mtime: createDate,
            ctime: createDate,
            birthtime: createDate,
        });
    }

    isFile() {
        return true;
    }

    isDirectory() {
        return false;
    }

    isBlockDevice() {
        return false;
    }

    isCharacterDevice() {
        return false;
    }

    isSymbolicLink() {
        return false;
    }

    isFIFO() {
        return false;
    }

    isSocket() {
        return false;
    }
}
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
                stats: new Stats(options.content),
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
            cb(null, vfile.stats);
            return;
        }
        return orig.apply(this, args);
    });
    createPatchFn(fs, 'statSync', function (orig, args, p) {
        const rp = path.resolve(p);
        const vfile = virtualFS.files[rp];
        if (vfile) {
            return vfile.stats;
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
