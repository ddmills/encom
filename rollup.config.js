import resolve from '@rollup/plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'src/index.js',
    output: {
        dir: 'build',
        name: 'geotic',
        format: 'es',
    },
    plugins: [babel(), commonjs(), resolve({ browser: true })],
};
