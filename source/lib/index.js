'use strict';

const AWS = require('aws-sdk');

const maxFileLength = 5368709120; //5GB
const partSize = (1024 * 1024 * 5); // 5mb
const maxUploadTries = 2;

class CopyFile {
    constructor(config){
        this._verifyConfig(config);
        this._defineParamsS3(config);
        this._initVariables();
    }

    _start(params, cb){
        if(_verifyParams(params)){
            this._getContentLenght(function(err, data){
                if (err) {
                    cb(err, null);
                }
                else {
                  this._initCopy(function(err, data){
                      if (err) {
                        return cb('Error on copy object.',null);
                      }
                      cb(null, data);
                  });
                }
            });
        }        
    }

    _verifyConfig(config){
        if(config){
            if(!config.access_key)
                this._throwError('access_key undefined!');
        
            if(!config.secret_key)
                this._throwError('secret_key undefined!');
            
            if(!config.region)
                this._throwError('region undefined!');
        }
    };

    _defineParamsS3(config){
        if(config){
            this._aws_access_key = config.access_key;
            this._aws_secret_key = config.secret_key;
            this._aws_region = config.region;
            this._s3 = new AWS.S3(
                {
                    accessKeyId: this._aws_access_key,
                    secretAccessKey: this._aws_secret_key,
                    region: this._aws_region,
                    signatureVersion: 'v4'
                }
            );
        }
        else{
            this._s3 = new AWS.S3({
                signatureVersion: 'v4'
            });
        }
    };

    _initVariables(){
        this._numPartsLeft = 0;
        this._contentLength = 0;
        this._multipartMap = { Parts: [] };
    };

    _verifyParams(params){
        if(!params)
            this._throwError('Params undefined!');

        if(!params.source_bucket)
            this._throwError('source_bucket undefined!');

        if(!params.source_key)
            this._throwError('source_key undefined!');

        if(!params.destination_bucket)
            this._throwError('destination_bucket undefined!');

        if(!params.destination_key)
            this._throwError('destination_key undefined!');

        this._params = params;
        return true;
    };

    _getContentLenght(cb) {
        this._s3.headObject({ Bucket: this._params.source_bucket, Key: this._params.source_key }, function(err, data) {
            if (err){
                this._log(err);
                 return cb('Error on get object.',null);
            }
            else {
                this._contentLength = data.ContentLength * 1;
                cb(null, data);
            }
        });
    }

    _initCopy(cb){
        this._startTime = new Date();
        if (this._contentLength > maxFileLength) {
            this._initMultiPart(function(err, data){
              if (err) {
                return cb('Error on copy object.',null);
              }
              return cb(null, data);
            });
          }
          else {
              this_.copyFullObject(function(err, resp) {
              if (err) {
                return cb('Error on copy object.',null);
              }
              return cb(null, resp);
            });
          }
    };

    _initMultiPart(cb){
        this._s3.createMultipartUpload({ Bucket: this._params.destination_bucket, Key: this._params.destination_key }, function(err, multipart) {
            if(err){
                this._log(err)
                return cb('Error on copy object.',null);
            }
  
           this._numPartsLeft = Math.ceil(this._contentLength / partSize) - 1;
           let _partNum = 0;
  
           for (var start = 0; start < _contentLength; start += partSize) {
  
               _partNum++;
               let _startByte = (start === 0 ? start : start + 1);
               let _endByte = (start + partSize > this._contentLength ? this._contentLength : start + partSize);
  
               var partParams = {
                   Bucket: this._params.destination_bucket,
                   Key: this._params.destination_key,
                   CopySource: [this._params.source_bucket, this._params.source_key].join('/'),
                   CopySourceRange: ['bytes=', _startByte,"-", _endByte].join(''),
                   PartNumber: String(_partNum),
                   UploadId: multipart.UploadId
               };
  
               this._uploadPartCopy(multipart, partParams, 1);
           }
  
           return cb(null, multipart);
       });
  
      };

    
      _uploadPartCopy(multipart, partParams, tryNum, cb){
        tryNum = tryNum || 1;
        this._s3.uploadPartCopy(partParams, function(err, data) {
            if (err){
                _log(err);
                if (tryNum < maxUploadTries) {
                    _log(['Retrying upload of part: #', partParams.PartNumber].join(' '));
                    uploadPartCopy(multipart, partParams, tryNum + 1);
                } else {
                    _log(['Failed uploading part: #', partParams.PartNumber].join(' '));
                }
            }
            else {
                _log(data);
  
                 _multipartMap.Parts[this.request.params.PartNumber - 1] = {
                      ETag: data.ETag,
                      PartNumber: Number(this.request.params.PartNumber)
                  };
  
                if (--_numPartsLeft > 0) return; // complete only when all parts uploaded
  
                var doneParams = {
                    Bucket: multipart.Bucket,
                    Key: multipart.Key,
                    MultipartUpload: _multipartMap,
                    UploadId: multipart.UploadId
                };
                _completeMultipartUpload(doneParams, function(err, data){{
                
                }});
            }
        });
    };

    _completeMultipartUpload(doneParams, cb){
        this._log('Completing upload...');
  
        this._s3.completeMultipartUpload(doneParams, function(err, data) {
            if (err) {
                _log(err)
                return cb('An error occurred while completing multipart upload.',null);
            }
            this._endTime = new Date();
            _log(['Completed upload in', this._totalTimeInSeconds(), 'seconds'].join(' '));
            return cb(null, data);
        });
      }

    
      _copyFullObject(cb){
        let paramsCopy = {
            Bucket: this._params.destination_bucket,
            CopySource: [this._params.source_bucket, this._params.source_key].join('/'),
            Key: this._params.destination_key
        };

        this._s3.copyObject(paramsCopy, function(err, data) {
           if (err)
           {
             _log(err);
             return cb('Error on copy object.',null);
           }
           else {
             this._endTime = new Date();
            _log(['Completed upload in', this._totalTimeInSeconds(), 'seconds'].join(' '));            
             this._log(data);
             return cb(null, data);
           }
        });
    }

    _totalTimeInSeconds() {
        if(this._startTime && this._endTime){
            return ((this._endTime - this._startTime) / 1000);
        }
        return 0;
    };

    _log(msg){

    };

    _throwError(err){
        if(err){
            this._log(err);
            throw Error(err);
        }
        return false;
    };
};

module.exports = CopyFile;