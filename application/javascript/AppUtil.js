/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict'; 
//node js 는 'use strict'가 있음을 통해 알 수 있음. require도 그 증명 중 하나.

const fs = require('fs');
const path = require('path');
const { config } = require('process');

//모듈 정의는 exports.~~~~ 으로 정의

exports.buildCCPOrg1 = () => {
	// load the common connection configuration file
	const ccpPath = path.resolve(__dirname, '../', 'config', 'connection-org1.json');
	const fileExists = fs.existsSync(ccpPath);
	if (!fileExists) {
		throw new Error(`no such file or directory: ${ccpPath}`);
	}
	const contents = fs.readFileSync(ccpPath, 'utf8'); //array 파일이 들어온 후 json parse.

	// build a JSON object from the file contents
	const ccp = JSON.parse(contents);

	console.log(`Loaded the network configuration located at ${ccpPath}`);
	return ccp;
};

exports.buildCCPOrg2 = () => {
	// load the common connection configuration file
	const ccpPath = path.resolve(__dirname, '../', 'config','connection-org2.json');
	const fileExists = fs.existsSync(ccpPath);
	if (!fileExists) {
		throw new Error(`no such file or directory: ${ccpPath}`);
	}
	const contents = fs.readFileSync(ccpPath, 'utf8');

	// build a JSON object from the file contents
	const ccp = JSON.parse(contents);

	console.log(`Loaded the network configuration located at ${ccpPath}`);
	return ccp;
};

exports.buildWallet = async (Wallets, walletPath) => {
	//path를 받아와서 let wallet의 내용을 만들어 리턴함.

	// Create a new  wallet : Note that wallet is for managing identities.
	let wallet;
	if (walletPath) {
		wallet = await Wallets.newFileSystemWallet(walletPath);
		console.log(`Built a file system wallet at ${walletPath}`);
		
	} else {
		wallet = await Wallets.newInMemoryWallet();
		console.log('Built an in memory wallet');
	}

	return wallet;
};

exports.prettyJSONString = (inputString) => {
	if (inputString) {
		 return JSON.stringify(JSON.parse(inputString), null, 2);
	}
	else {
		 return inputString;
	}
}
