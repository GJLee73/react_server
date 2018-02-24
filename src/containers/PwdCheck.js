import React, { Component } from 'react';
import {connect} from 'react-redux'
import {pwdVerify} from '../modules/authentication'
 

class PwdCheck extends Component {
    constructor(props) {
        super(props);
        this.state = { pwd:'' }
        this.handleChange=this.handleChange.bind(this)
        this.pwdVerifyRequest=this.pwdVerifyRequest.bind(this)
    }
    
	handleChange(e){ 
		this.setState({pwd: e.target.value});
    }
    pwdVerifyRequest(pwd){
        this.props.pwdVerify(pwd).then(()=>{
            this.props.history.push('/settings/'+this.props.match.params.typename)
        }).catch(()=>{
            alert('비밀번호를 올바르게 입력하세요!')
        })
    }
		
    render() { 
        
    return (
        <div>
            패스워드를 입력하시오.
            <input type='password' placeholder='password' value={this.state.pwd} onChange={this.handleChange}/>
            <button onClick={()=>{this.pwdVerifyRequest(this.state.pwd)}}>확인</button>
        </div>
    )
    }
}
const mapStateToProps = (state) =>{
	return{
        status: state.authentication.get('status'),
        allInfo: state.authentication.get('allInfo')
	};
};

const mapDispatchtoProps = (dispatch) => {
	return {

        pwdVerify:(pwd)=> dispatch(pwdVerify(pwd))
	};
}

export default connect(mapStateToProps, mapDispatchtoProps)(PwdCheck);