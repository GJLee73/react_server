
import {Map} from 'immutable';
import { handleActions} from 'redux-actions';
import axios from 'axios';

const LOGIN = "AUTH/LOGIN";
const LOGIN_LOADING = 'AUTH/LOGIN_LOADING';
const LOGIN_SUCCESS = "AUTH/LOGIN_SUCCESS";
const LOGIN_FAILURE = "AUTH/LOGIN_FAILURE";

const GET_STATUS = "AUTH/GET_STATUS";
const GET_STATUS_LOADING = "AUTH/GET_STATUS_LOADING";
const GET_STATUS_SUCCESS = "AUTH/GET_STATUS_SUCCESS";
const GET_STATUS_FAILURE = "AUTH/GET_STATUS_FAILURE";

const GET_ALLINFO = "AUTH/GET_ALLINFO";
const GET_ALLINFO_LOADING = "AUTH/GET_ALLINFO_LOADING";
const GET_ALLINFO_SUCCESS = "AUTH/GET_ALLINFO_SUCCESS";
const GET_ALLINFO_FAILURE = "AUTH/GET_ALLINFO_FAILURE";

const LOGOUT = "AUTH/LOGOUT";
const CLEAN = 'AUTH/CLEAN'

const FINDID = 'AUTH/FINDID'
const FINDID_LOADING = 'AUTH/FINDID_LOADING'
const FINDID_SUCCESS = 'AUTH/FINDID_SUCCESS'
const FINDID_FAILURE = 'AUTH/FINDID_FAILURE'

const FINDPWD = 'AUTH/FINDPWD'
// const FINDPWD_LOADING = 'AUTH/FINDPWD_LOADING'
// const FINDPWD_SUCCESS = 'AUTH/FINDPWD_SUCCESS'
// const FINDPWD_FAILURE = 'AUTH/FINDPWD_FAILURE'

const RESENDEMAIL ='AUTH/RESENDEMAIL'

const PWDVERIFIED = 'AUTH/PWDVERIFIED'
const PWDVERIFIED_LOADING = 'AUTH/PWDVERIFIED_LOADING'
const PWDVERIFIED_SUCCESS = 'AUTH/PWDVERIFIED_SUCCESS'
const PWDVERIFIED_FAILURE = 'AUTH/PWDVERIFIED_FAILURE'


const initialState = Map({
    login: Map({status: 'INIT'}),
    status: Map({
        isLoggedIn: false,
        verified: false,
        currentUser: ''
    }),
    findId: Map({
        gottenId:''
    }),
    allInfo: Map({}),
    pwdVerified:false


});

function loginApiRequest(userId, password){
    return axios.post('/api/account/signin', {userId, password})
            .then((res)=> {
                return Promise.resolve(
                {userId,verified:res.data.verified})})
            .catch((err)=> Promise.reject(err))
}

function getStatusApiRequest(){
    return axios.get('/api/account/getinfo')
            .then((res)=>(Promise.resolve(res.data.info.userId)))
            .catch(err=>(Promise.reject()))
}
/**db에 담긴 모든 데이터를 받아온다
 * @param {res.data.info} {object}- 로그인 된 유저의 모든 db정보를 받아온다. pwd제외.
 */
function getAllInfoRequest(){//TODO
    console.log(1)
    return Promise.resolve({userId:'g1',email:'g1',nickname:'g1',phone:'000-0000-0000'})
    // return axios.get('/api/account/getinfo')
    //         .then((res)=>(Promise.resolve(res.data.info)))
    //         .catch(err=>(Promise.reject()))
}

function findIdRequest(name,email){//todo: dispatch를 안했는데도 실행이 됨.... 2.24
   return axios.post('/api/account/findId', {name, email})
	.then((res)=>{
	    return Promise.resolve(res.data.userId)})
	.catch(err=>(Promise.reject(err)))
}


export function findPwd(id,email){
    return new Promise((resolve,reject)=>{
     if(id=='g1'&&email=='g1'){
        resolve()
         }else {reject()}
    })
    }
      
 

function pwdVerifyRequest(pwd){
    if(pwd==='g1')
    return Promise.resolve()
    else{
        return Promise.reject()
    }
}
     
 


export function reSendEmail(email,userId) {
    return (dispatch)=>{
        return axios.post('/api/account/resend',{email,userId})
            .then((response) => {
                dispatch({type: RESENDEMAIL});
            });
    };
}

export function logoutRequest() {
    return (dispatch) => {
        return axios.post('/api/account/logout')
            .then((response) => {
                dispatch({type: LOGOUT});
            });
    };
}
export function cleanCurrentUser(){
    return (dispatch)=>Promise.resolve(dispatch({type: CLEAN}))
}

export const loginRequest = (userId, password)=>({
    type: LOGIN,
    payload: loginApiRequest(userId, password)
})

export const getStatusRequest = ()=>({
    type: GET_STATUS,
    payload: getStatusApiRequest()
})

export const getAllInfo = ()=>({
    type: GET_ALLINFO,
    payload: getAllInfoRequest()
})

export const findId = (name,email)=>({
    type: FINDID,
    payload: findIdRequest(name,email)
})

export const pwdVerify = (pwd)=>({
    type: PWDVERIFIED,
    payload: pwdVerifyRequest(pwd)
})



export default handleActions({
    [LOGIN_LOADING]: (state, action)=>{
        console.log(state)
        return state.setIn(['login', 'status'], 'WAITING'); 
    },

    [LOGIN_SUCCESS]: (state, action)=>{
        return state.setIn(['login', 'status'], 'SUCCESS')
                    .mergeIn(['status'], Map({verified: action.payload.verified, currentUser: action.payload.userId}))
                    .setIn(['status','isLoggedIn'],true)
    },

    [LOGIN_FAILURE]: (state, action)=>{
        return state.setIn(['login','status'], 'FAILURE');
    },

    [GET_STATUS_LOADING]: (state, action)=>{
        return state.setIn(['status','isLoggedIn'], true);
    },

    [GET_STATUS_SUCCESS]: (state, action)=>{
        return state.mergeIn(['status'], Map({isLoggedIn: true, currentUser: action.payload}))
    },

    [GET_STATUS_FAILURE]: (state, action)=>{
        return state.setIn(['status','isLoggedIn'], false);
    },

    [GET_ALLINFO_LOADING]: (state, action)=>{
        return state;
    },

    [GET_ALLINFO_SUCCESS]: (state, action)=>{
        return state.set('allInfo', Map(action.payload));
    },

    [GET_ALLINFO_FAILURE]: (state, action)=>{
        return state.set('allInfo', '');
    },

    [LOGOUT]: (state, action)=>{
        return state.mergeIn(['status'], Map({isLoggedIn: false, currentUser: ''}));
    },
    [RESENDEMAIL]: (state,action)=>{
        return state
    },
    [CLEAN]: (state,action)=>{
        return state.setIn(['status','currentUser'],'')
    },
    [FINDID_LOADING]:(state,action)=>{
        return state.setIn(['findId','gottenId'],'')
    },
    [FINDID_SUCCESS]: (state,action)=>{
        return state.setIn(['findId','gottenId'],action.payload)
    },
    [FINDID_FAILURE]: (state,action)=>{
        return state.setIn(['findId','gottenId'],'')
    },
    [FINDPWD]:(state,action)=>{
        return state
    },
    [PWDVERIFIED_LOADING]:(state,action)=>{
        return state.set('pwdVerified', false)
    },
    [PWDVERIFIED_SUCCESS]:(state,action)=>{
        return state.set('pwdVerified', true)
    },
    [PWDVERIFIED_FAILURE]:(state,action)=>{
        return state.set('pwdVerified', false)
    }

}, initialState)
