/* eslint-disable */
const modifyPkgHomePage = require('build-plugin-component/src/utils/modifyPkgHomePage');

module.exports = ({ context, onHook }) => {
    const { rootDir, pkg } = context;
    onHook('after.build.compile', async () => {
        // 提前中断 babel compile 任务，用 tsc 方式编译
        await modifyPkgHomePage(pkg, rootDir);
        process.exit(0);
    });
};
