/* jshint node: true */

const Code = require('code');
const Lab = require('lab');
const lab = Lab.script();
const AWS = require('aws-sdk-mock');
const CopyFile = require('../lib/index.js');
const configMock = {
    access_key: '123NAOEHUMAKEY',
    secret_key: '123NAOEHUMSECRET',
    region: 'us-east-1'
};

lab.experiment('Tests for lib aws-copy-large-files-s3', () => {
    var _cf = new CopyFile({});
    _cf._start();
});

exports.lab = lab;