import { S3Client } from "@aws-sdk/client-s3";
import { S3 } from "aws-sdk";
const s3 = new S3({
    accessKeyId : process.env.S3_ACCESS_KEY,
    secretAccessKey : process.env.S3_SECRET_KEY,
    region: process.env.S3_REGION,
})
const s3Client = new S3Client({
    region: process.env.S3_REGION,
    credentails : {
        accessKeyId : process.env.S3_ACCESS_KEY,
        secretAccessKey : process.env.S3_SECRET_KEY,
    }
});
const FileUploadHelper = {
    uploadFile : async function(fileName, fileContent, filemimetype) {
        let params = {
            Bucket : process.env.S3_BUCKET,
            Key : fileName,
            Body: fileContent,
            ContentType : filemimetype,
            Expires : 300   
        }
        return await s3.upload(params).promise();
    },
    uploadFileClient : async function(fileName, fileContent, filemimetype) {
        const { Upload } = require('@aws-sdk/lib-storage');
        const { PutObjectCommand } = require('@aws-sdk/client-s3');
        const date = new Date();
        const year = date.getUTCFullYear();
        console.log('process.env.S3_BUCKET',process.env.S3_BUCKET);
        const params = {
            Bucket : process.env.S3_BUCKET,
            Key : fileName,
            Body: fileContent,
            ContentType : filemimetype,
            // Expires : year
        }
        const upload =  new Upload({
            client:s3Client,
            params : params
        });
        s3Client.send( new PutObjectCommand(upload));
        
    }
}

export default FileUploadHelper;