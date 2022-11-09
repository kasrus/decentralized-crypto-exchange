export const provider = (state = {}, action) => {
    switch(action.type) {
        case 'PROVIDER_LOADED':
            return {
                //... means updating the existing state, then add connection
                ...state,
                connection: action.connection
            }
        case 'NETWORK_LOADED':
            return {
                ...state,
                chainId: action.chainId
            }
        case 'ACCOUNT_LOADED':
            return {
                ...state,
                account: action.account
            }
        case 'ETHER_BALANCE_LOADED':
            return {
                ...state,
                balance: action.balance
            }
    
        default:
            return state
    }
}

const DEFAULT_TOKEN_STATE = {
    loaded: false,
    contracts: [],
    symbols: []
}

export const tokens = (state = DEFAULT_TOKEN_STATE, action) => {
    switch (action.type) {
        case 'TOKEN_1_LOADED':
            return {
                ...state,
                loaded: true,
                contracts: [...state.contracts, action.token], //extend the entire existing array
                symbols: [...state.symbols, action.symbol]
            }

        case 'TOKEN_2_LOADED':
            return {
                ...state,
                loaded: true,
                contracts: [...state.contracts, action.token], //extend the entire existing array
                symbols: [...state.symbols, action.symbol]
            }
        default:
            return state
    }
}

export const exchange = (state = { loaded: false, contract: {} }, action ) => {
    switch (action.type) {
        case 'EXCHANGE_LOADED':
            return {
                ...state,
                loaded: true,
                contract: action.exchange
            }

        default:
            return state
    }
}
