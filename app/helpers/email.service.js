import { promises as fs } from 'fs';
import { join } from 'path';
import { createTransport } from 'nodemailer';
import _ from "lodash";

const transportOptions = {
	host: process.env.SMTP_HOST,
	port: process.env.SMTP_PORT,
	secure: true,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS
	}
}


const transporter = createTransport(transportOptions);

// transporter.verify(function(error, success) {
//    if (error) {
//         console.log(transporter.verify);
//         console.log(error);
//    } else {
//         console.log('Email Server is ready to take our messages');
//    }
// });

const mailOptions = {
	from: `"Team Prixy" <${process.env.EMAIL_NO_REPLY}>`,
	to: '',
	subject: '',
	html: '',
};

const sendEmail = async function (templateName, data) {
	let content = await patchTemplateWithData(templateName, data);
	let _mailOptions = Object.assign(mailOptions, {
		to: data.to,
		subject: content.subject,
		html: content.html
	});

	return await transporter.sendMail(_mailOptions);
}

const patchTemplateWithData = async function (templateName, data) {
	let subject = '', html = '';
	try {
		let filePath = join(VIEW_PATH, 'emailTemplate', templateName);
		let fileContent = await fs.readFile(filePath);

		switch (templateName) {
			case 'welcome.html':
				if (templateName == 'welcome.html')
					subject = "Welcome to Prixy";

				html = fileContent.toString()
					.replace(new RegExp("{{username}}", 'g'), data.username)
					.replace(new RegExp("{{code}}", 'g'), data.code)
					.replace(new RegExp("{{password}}", 'g'), data.password)
					.replace(new RegExp("{{email}}", 'g'), data.email)
					.replace(new RegExp("{{s3BucketURL}}", 'g'), process.env.S3_BUCKET_PATH)
					.replace(new RegExp("{{link}}", 'g'), data.link)
				break;
		}
	}
	catch (err) {
		console.log("Error in email helper", err);
	}

	return { subject: subject, html: html }
}

// all no-reply emails
const emailService = {
	welcome: async (data) => {
		return await sendEmail('welcome.html', data);
	},
}

// other then no-reply add here
// also need to verify for the function name to be unique in both the objects (emailService and emailService2)
const emailService2 = {}

export default _.merge({}, emailService2, emailService,sendEmail);