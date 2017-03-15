import * as types from 'actions/ActionTypes';
import update from 'react-addons-update';

const initialState = {
	hostsList: {
		status: 'INIT',
		data: []
	},
	appList:{
		status: 'INIT',
		data:[]
	},
	startGame: {
		status: 'INIT',
		currentGame: 'INIT'
	}
}

export default function moonlight(state, action){
	if(typeof state == "undefined"){
		state = initialState;
	}

	switch(action.type){
		case types.MOONLIGHT_GET_HOSTS:
			return update(state, {
				hostsList: {
					status: {$set: 'GET_WAITING'}
				}
			})

		case types.MOONLIGHT_GET_HOSTS_SUCCESS:
			return update(state, {
				hostsList: {
					status: {$set: 'GET_SUCCESS'},
					data: {$set: action.data}
				}
			})

		case types.MOONLIGHT_GET_HOSTS_FAILURE:
			return update(state, {
				hostsList: {
					status: {$set: 'GET_FAILURE'},
					data: {$set: action.data}
				}
			})	

		case types.MOONLIGHT_GET_APPS:
			return update(state,{
				appList: {
					status: {$set: 'WAITING'}
				}
			})
				
		case types.MOONLIGHT_GET_APPS_SUCCESS:
			return update(state, {
				appList: {
					status: {$set: 'SUCCESS'},
					data: {$set: action.data}
				}
			})

		case types.MOONLIGHT_GET_APPS_FAILURE:
			return update(state, {
				appList: {
					status: {$set: 'FAILURE'}
				}
			})			

		case types.MOONLIGHT_ADD_HOST:
			return update(state, {
				hostsList: {
					status: {$set: 'ADD_WAITING'}
				}
			})

		case types.MOONLIGHT_ADD_HOST_SUCCESS:
			return update(state, {
				hostsList: {
					status: {$set: 'ADD_SUCCESS'},
					data: {$push: [action.data]}
				}
			})

		case types.MOONLIGHT_ADD_HOST_FAILURE:
			return update(state, {
				hostsList: {
					status: {$set: "ADD_FAILURE"}
				}
			})

		case types.MOONLIGHT_START_GAME:
			return update(state, {
				startGame: {
					status: {$set: "WAITING"}
				}		
			})

		case types.MOONLIGHT_START_GAME_SUCCESS:
			return update(state, {
				startGame: {
					status: {$set: "SUCCESS"},
					currentGame: {$set: action.appId}
				}
			})

		case types.MOONLIGHT_START_GAME_FAILURE:
			return update(state, {
				startGame: {
					status: {$set: 'FAILURE'},
				}
			})



		default:
			return state;				
	}
	return state;
}