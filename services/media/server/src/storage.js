import {S3Client,GetObjectCommand,PutObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
const endpoint=process.env.S3_ENDPOINT||undefined;
const client=new S3Client({region:process.env.S3_REGION||'us-east-1',endpoint,forcePathStyle:Boolean(endpoint),credentials:{accessKeyId:process.env.S3_ACCESS_KEY||'',secretAccessKey:process.env.S3_SECRET_KEY||''}});
export async function signedAudioUrl(key,seconds=300){return getSignedUrl(client,new GetObjectCommand({Bucket:process.env.S3_BUCKET,Key:key,ResponseContentType:'audio/mp4',ResponseContentDisposition:'inline'}),{expiresIn:seconds})}
export async function signedObjectUrl(key,contentType='application/octet-stream',seconds=300){return getSignedUrl(client,new PutObjectCommand({Bucket:process.env.S3_BUCKET,Key:key,ContentType:contentType}),{expiresIn:seconds})}
