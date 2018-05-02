/**
 *  @file	auth.method.js 
 *  @brief	유저 인증에 사용하는 함수들을 정의
 *  @author	DotOut Inc, KKS
 *
 *  @see	return new Promise - 아래 함수들은 모두 Promise 객체를 리턴한다. \n
 *			따라서 어떤 함수로든 Promise Chain을 시작할 수 있다. \n
 *
 *			아래 문서에서 유저정보를 저장하는 이름 user와 info는 아래 기준으로 구분한다. \n
 *			* user - 위 문서에서 user는 DB에서 가져온 데이터 원본 혹은 수정본을 의미한다. \n
 *					DB에 있는 모든 property가 인자로 딸려오지만, 해당 문서에서는 꼭 필요한 property 설명만 기재\n
 *			* info - 위 문서에서 info는 사용자가 작성하여 POST로 보낸 정보들의 묶음을 의미한다. \n
 *			User객체 - 쿼리를 이용하여  유저 DB에 직접 접근하도록 만들어진 모델이다. \n
 *			위 문서에서 정의된 함수들은 User객체의 함수를 불러 간접적으로 DB에 접근한다.
 *
 *  @todo	작업하는 중 필요한 라우터가 생기면 거기에 맞춰 새 함수 생성
 */

const User = require('../../models/user')
const express = require('express')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const app = express()
const Conf = require('./mailconfig')
const mailConfig = Conf.mailConfig
const smtpTransport = nodemailer.createTransport(Conf.smtpConfig)




/**
 *  @brief  유저 정보를 DB에서 삭제하는 함수
 *  @param	{Object}	user	- DB에서 찾은 정보.
 *    @property	{String}	userId	- 삭제할 정보 검색을 위한 유저의 id
 *  
 * @return	Promise
 *   @resolve	{String} 	- 유저를 삭제하고 success 메세지를 다음 Promise로 전달	
 *   @reject	X		
 *  
 * @todo	에러핸들러가 완성되면 에러처리 코드 삽입
 *			예외처리구문 삽입
 */
exports.del = (user) => {
    return new Promise( (res,reject) => {
		if(user==undefined||user.userId == undefined)
			reject({
				success: false,
				status: 400,
				message: "Not exist user"})
		else{
			User.del(user)
			res({success:true})
		}
    })
}


/**
 *  @brief  비밀번호 찾기, 이메일 인증 등 임시로 사용할 토큰을 발행하는 함수
 * 
 *  @param	{Object}	user	- DB에서 찾은 정보.
 *    @property	{String}	userId	- 토큰을 통해 유저를 식별하기 위한 id 정보
 *    @property {Date}		dat		- 토큰을 발행한 시점의 시간, 토큰의 만료를 처리하기 위함
 *  @param	{string} 	secret	- config에 저장되어있는 토큰의 해싱키
 * 
 *  @return	Promise
 *    @resolve	{Object}	- 토큰이 정상적으로 발행되었을 경우 실행한다. user.token에 토큰 정보를 저장하고 다음 Promise에 user를 넘겨줌
 *	  @reject	{String}	- 토큰 발생과정에서 오류가 생기면 error throw

 *  @todo	param의 secret tokenize와 다르게 바꾸기
 *			임시 인증에 사용할 추가 정보 있나 보기
 *
 *  @deprecate	"ChocoPi"는 임시로 지정한 비밀 key, Config파일로 빼야함
 * 				토큰에 기본적으로 발행시간이 들어가는 것 같음. 이를 확인해보고 dat이 필요없으면 삭제
 */
exports.tempTokenize = (user, secret) => {
    return new Promise((res, reject) => {
		var dat = Date.now()
		console.log('start temp tokenize at '+dat)
		jwt.sign(
			{
			userId: user.userId,
			date:	dat
			},
			"ChocoPi",
			{
			issuer:	'sprout.io' ,//TODO: what is our domain?!
			subject: 'UserAuth'
			}, (err, token) => {
				if(err) {
					console.log(err)
					reject({
						success: false,
						status: 400,
						message: "Can not get tempToken"
					})
				}
				else{
					user.token = token
					res(user)}
				})
	})
}



/**
 *  @brief  유저 정보를 수정할 때 쓰는 함수, info의 필드에 있는 데이터가 user 객체의 필드에 그대로 갱신됨
 * 			예를들어 user = { key1: 1, key2: 2 }  info = { key2: 4 } 이면 user = { key1: 1, key2: 4 }로 갱신됨
 *  @param	{Object}	user	- DB에서 가져온 기존 정보.
 * 	  @property	{String}	userId		- DB에서 데이터 검색을 위한 유저의 ID
 *  @param	{Object}	info	- 유저가 변경하려는 정보 객체. 아래 명시되지 않은 property가 있을 경우 오류가 발생할 가능성이 있음
 *    @property {String}	nickname	- 유저의 닉네임
 *    @property	{Date} 		birth		- 유저의 생년월일
 *    @property	{Char} 		gender		- 유저의 성별
 *    @property	{String} 	password	- 유저의 password에 해당하는 raw 패스워드
 *    @property	{String} 	email		- 유저의 이메일, 수정 전 이메일 중복 확인 및 이메일 인증 필요
 *    @property	{String} 	phone		- 유저의 핸드폰 번호
 *    @property	{Boolean} 	verified	- 유저가 이메일 인증을 했는지 여부
 * 
 *  @return	Promise
 * 	  @resolve	{String} 	- 유저 업데이트가 제대로 실행되면 다음 프로미스로 메세지 전달
 *	  @reject	X

 *  @todo	예외처리 다듬기, 에러핸들러 적용
 * 			인가되지 않은 property가 info의 property로 들어왔을 때의 경우 생각하기
 * 			이메일 변경을 까다롭게 할 필요성 있음
 *			함수가 제대로 실행되었을 때 String 메세지가 아닌 respond에서 처리가능한 인자로 넘기기
 */
exports.modify = ( user, info ) => {
    return new Promise((res, reject) => {
	    User.update(user, info)
	    .then((user)=>{res(user)})
    })
}


/**
 *  @brief  유저를 생성하는 함수이다.
 * 
 *  @param	{Object}	user	 - id를 key로 DB에서 검색해온 유저의 정보이다. 만약 SELECT 실행 결과 유저가 없다면 모든 필드값은 undefined가 된다.
 *  @param	{Object} 	info	 - 사용자가 입력한 유저 정보
 * 
 *  @return	Promise
 *    @resolve	{Object}	- DB에 유저 생성이 완료되면 사용자가 입력한 정보인 info를 다음 Promise로 보낸다.
 *	  @reject	{String}	- user가 undefined가 아니라면, 즉 이미 있는 계정이면 throw error 시킨다.
 *
 *  @todo	에러 핸들러를 만들어 에러 처리 통합하기
 */

exports.create = (user,info) => {
    return new Promise( (resolve, reject)=>{
	if(user&&user.userId) {
		console.log(user.userId + ' was already registered')
		reject({
			success: false,
			status: 200,
			message: "user name was already registered"
		})
	}
	else
		User.create(info).then( ()=>{ res(info) } )
    
	})
}

/**
 *  @brief  인증을 위한 토큰을 url 쿼리에 포함하여 메일로 발송하는 함수
 * 
 *  @param  {Object}	info		- 회원가입할 때 사용한 유저 정보를 그대로 받아온다.
 *    @property	{String}	token		- url쿼리에 들어갈 유저의 토큰 값
 * 	  @property	{String}	email		- 메일을 전송 받을 유저의 이메일 정보
 * 	  @property	{String}	userId		- 이 함수를 실행할 때 필요한 필드는 아니나 console에 기록하기 위해 넣음 
 *	
 *  @return	Promise
 *    @resolve	{String}	- 메일 발송이 성공적으로 이루어졌을 때 다음 Promise로 "Mail Sent!" 라는 메세지를 보냄
 *    @reject:  {String}	- 메일 발송이 실패했을 때 error 처리
 * 
 *  @todo	- 유효번호로 메일 인증받는 시스템 생각해보기 (할지 안할지 다시 얘기해보기)
 *			- respond 함수가 완성되면 다음 Promise로 보낼 내용 수정하기
 *			- 에러핸들러 완성하면 에러 처리
 */
exports.sendmail = (info) => {
    return new Promise((res, reject) => {
	var host = 'localhost:4000'
	var link = "http://" + host + "/verified/"+info.token;
	mailConfig.html = "<a href="+link+">Click</a>"
	mailConfig.to = info.email

	smtpTransport.sendMail(mailConfig, (error, response) => {
		if(error){
			console.log(error)
			reject({
				success: false,
				status: 400,
				message: "Can not send mail"
			})
		}else{
			console.log("Message sent: " + info.email);
			res({
				success: true,
				status: 400,
				message: "Mail send to "+info.email});
			}
		})
	})
}



/**
 *  @brief  putUsers 라우터에서 필드와 url을 체크하기 위한 함수
 * 
 *  @param  {Object}	info			- 클라이언트에서 수정을 위해 보내준 필드 정보
 *  @param	{String}	fieldUrl		- URL인 POST /api/users/{id}/{field} 에서 {field}에 해당하는 이름 
 * 
 *  @return	No returns
 */
exports.fieldCheck = (info, fieldUrl) => {
	console.log('fieldCheck')
	return new Promise( (res, reject) => {
		const bodyField= Object.keys(info)
		if(fieldUrl == 'verification'){
			if(bodyField.length > 0)
				reject({
					success: false,
					status: 400,
					message: "Verification do not need JSON input"
				})
			else{
				//메일 인증 요청
				console.log('메일인증')
				res({verified: true})
			}
		}
		else if(bodyField.length != 1){
			reject({
				success: false,
				status: 400,
				message: "too much fields or no field"
			})
		}
		else if(fieldUrl != bodyField[0]){
			reject({
				success: false,
				status: 400,
				message: "url was not matched to User field"
			})
		}
		else{
			switch(fieldUrl){
				case 'password':
				//추가 인증여부
					res({password: info.password})
				break;


				case 'name':
					res({name: info.name})
				break;


				case 'nickname':
					res({nickname: info.nickname})
				break;


				case 'birth':
					res({birth: info.birth})
				break;

				case 'gender':
					res({gender: info.gender})
				break;

				case 'email':
				// 추가 인증 여부
					res({email: info.email})	
				break;


				case 'phone':
					res({phone: info.phone})
				break;



				default:
					reject({
						success: false,
						status: 400,
						message: "The field was able to modify"
					})
			}

		}
	})
}