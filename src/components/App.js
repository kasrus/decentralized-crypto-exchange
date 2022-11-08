import { useEffect } from 'react';
import config from '../config.json';
import { useDispatch } from 'react-redux';
import { 
    loadProvider, 
    loadNetwork, 
    loadAccount, 
    loadToken 
} from '../store/interactions';

function App() {
    const dispatch = useDispatch();

    const loadBlockchainData = async() => {
        await loadAccount(dispatch);

        //Connect ethers to blockchain
        const provider = loadProvider(dispatch);
        const chainId = await loadNetwork(provider, dispatch);

        //Token smart contract
        await loadToken(provider, config[chainId].DApp.address, dispatch);
    }

    useEffect(() => {
        loadBlockchainData();
        //do more stuff
    })

    return (
      <div>
  
        {/* Navbar */}
  
        <main className='exchange grid'>
          <section className='exchange__section--left grid'>
  
            {/* Markets */}
  
            {/* Balance */}
  
            {/* Order */}
  
          </section>
          <section className='exchange__section--right grid'>
  
            {/* PriceChart */}
  
            {/* Transactions */}
  
            {/* Trades */}
  
            {/* OrderBook */}
  
          </section>
        </main>
  
        {/* Alert */}
  
      </div>
    );
  }
  
  export default App;