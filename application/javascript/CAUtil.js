/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const adminUserId = 'admin';
const adminUserPasswd = 'adminpw';
// ca_org1= test-network/docker/docker-compose-ca.yaml 안에 ID와 PW지정.
// 왜 쓰는거야? 기존 yaml sh로 시작하는 CA 명령어와 연결해 주기 위해?

/**
 *
 * @param {*} FabricCAServices
 * @param {*} ccp
 */
exports.buildCAClient = (FabricCAServices, ccp, caHostName) => {
	// Create a new CA client for interacting with the CA.
	// test-network/peerorgnization/org1.example.com 내부 connection-org1.json 에 certificateAuthorities에 해당 정보있음.
	// json 타입 구조체들이 들어가있고 parse하면 구조체 데이터가 나오게 될 것임.
	const caInfo = ccp.certificateAuthorities[caHostName]; //connection-org1.json 안에 "certificateAuthorities"안의 데이터들을 가져옴.

	const caTLSCACerts = caInfo.tlsCACerts.pem;
	//json 일부 parsing data caInfo에 해당하는 부분을 또 caTLSCACerts로 만들어줌.

	const caClient = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);
	//caClient는 외부 SDK인 fabric-ca-client(app-marble.js의 맨 위에서 지정됨)에서 유래된 라이브러리. verify:false가 의미하는 건 뭔지 모르겠는데 이후 인증정보를 json config file에 있는 name도 가져와서 한데 묶어 caClient를 만들고 리턴함.

	console.log(`Built a CA Client named ${caInfo.caName}`);
	return caClient;
};

exports.enrollAdmin = async (caClient, wallet, orgMspId) => {
	try {
		// Check to see if we've already enrolled the admin user.
		const identity = await wallet.get(adminUserId); //wallet 검사
		if (identity) {
			console.log('An identity for the admin user already exists in the wallet');
			return;
		}
		console.log('enrollAdmin started');
		// Enroll the admin user, and import the new identity into the wallet.
		//caClient를 써서 enroll하는 부분. ID와 PW필요.
		const enrollment = await caClient.enroll({ enrollmentID: adminUserId, enrollmentSecret: adminUserPasswd });
		//certification을 위한 x509Identity 구조체를 만드는 코드
		const x509Identity = {
			credentials: {
				certificate: enrollment.certificate,
				privateKey: enrollment.key.toBytes(),
			},
			mspId: orgMspId,
			type: 'X.509',
		};
		await wallet.put(adminUserId, x509Identity);
		console.log('Successfully enrolled admin user and imported it into the wallet');
	} catch (error) {
		console.error(`Failed to enroll admin user : ${error}`);
	}
};

//유저 등록 - user와 admin 둘다 검사 user는 기존 아이디가 없어야만 새로 enorll가능.

//register는 admin에 의해, enroll은 user에 의해 된다.
exports.registerAndEnrollUser = async (caClient, wallet, orgMspId, userId, affiliation) => {
	try {
		// Check to see if we've already enrolled the user
		const userIdentity = await wallet.get(userId);
		if (userIdentity) {
			console.log(`An identity for the user ${userId} already exists in the wallet`);
			return;
		}

		// Must use an admin to register a new user
		const adminIdentity = await wallet.get(adminUserId);
		if (!adminIdentity) {
			console.log('An identity for the admin user does not exist in the wallet');
			console.log('Enroll the admin user before retrying');
			return;
		}

		// build a user object for authenticating with the CA
		const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
		const adminUser = await provider.getUserContext(adminIdentity, adminUserId);

		// Register the user, enroll the user, and import the new identity into the wallet.
		// if affiliation is specified by client, the affiliation value must be configured in CA
		const secret = await caClient.register({
			affiliation: affiliation,
			enrollmentID: userId,
			role: 'client'
		}, adminUser); //adminuser가 user를 register함을 확인가능


		//사용자가 하는 역할
		const enrollment = await caClient.enroll({
			enrollmentID: userId,
			enrollmentSecret: secret
		});
		const x509Identity = {
			credentials: {
				certificate: enrollment.certificate,
				privateKey: enrollment.key.toBytes(),
			},
			mspId: orgMspId,
			type: 'X.509', //admin 인증서
		};
		await wallet.put(userId, x509Identity);
		//최종 지갑에 put한다.
		console.log(`Successfully registered and enrolled user ${userId} and imported it into the wallet`);
	} catch (error) {
		console.error(`Failed to register user : ${error}`);
	}
};
