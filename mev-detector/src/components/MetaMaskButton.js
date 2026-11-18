import { useMetaMask } from '../utils/useMetaMask';

/**
 * MetaMask Wallet Connection Button Component
 * Displays connect button or wallet info based on connection status
 */
function MetaMaskButton() {
  const {
    account,
    chainId,
    isConnected,
    isConnecting,
    error,
    balance,
    isMetaMaskInstalled,
    connectWallet,
    disconnectWallet,
    formatAddress,
    getNetworkName
  } = useMetaMask();

  // Show error toast if there's an error
  const showError = (message) => {
    alert(message);
  };

  if (error) {
    showError(error);
  }

  return (
    <div className="flex items-center gap-3">
      {isConnected && account ? (
        // Connected State
        <div className="flex items-center gap-3">
          {/* Balance Display */}
          {balance && (
            <div className="hidden md:block text-right">
              <div className="text-xs text-slate-400">Balance</div>
              <div className="font-bold text-brand-neon">{balance} ETH</div>
            </div>
          )}

          {/* Network Badge */}
          {chainId && (
            <div className="hidden lg:flex items-center gap-1 px-3 py-1.5 bg-slate-800 rounded-lg border border-white/10">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-300">{getNetworkName(chainId)}</span>
            </div>
          )}

          {/* Wallet Info Dropdown */}
          <div className="relative group">
            <button
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 shadow-lg hover:shadow-orange-500/25"
              onClick={() => {}}
            >
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-mono">{formatAddress(account)}</span>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-24px)] bg-slate-800 border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="p-4 space-y-3">
                {/* Account Info */}
                <div>
                  <div className="text-xs text-slate-400 mb-1">Connected Account</div>
                  <div className="font-mono text-sm text-white break-all">{account}</div>
                </div>

                {/* Network Info */}
                {chainId && (
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Network</div>
                    <div className="text-sm text-white">{getNetworkName(chainId)}</div>
                  </div>
                )}

                {/* Balance Info */}
                {balance && (
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Balance</div>
                    <div className="text-lg font-bold text-brand-neon">{balance} ETH</div>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-white/10"></div>

                {/* Disconnect Button */}
                <button
                  onClick={disconnectWallet}
                  className="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-medium transition-all duration-200 border border-red-500/20"
                >
                  Disconnect Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Disconnected State
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 shadow-lg hover:shadow-orange-500/25 disabled:cursor-not-allowed"
        >
          {isConnecting ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M36.8273 4.53828L21.3369 15.8617L24.794 7.06953L36.8273 4.53828Z" fill="#E17726"/>
                <path d="M3.17648 4.53828L18.5154 15.9932L15.2059 7.06953L3.17648 4.53828Z" fill="#E27625"/>
                <path d="M31.6727 27.3266L27.825 33.2685L35.9734 35.5129L38.3053 27.473L31.6727 27.3266Z" fill="#E27625"/>
                <path d="M1.69894 27.473L4.02658 35.5129L12.175 33.2685L8.33154 27.3266L1.69894 27.473Z" fill="#E27625"/>
                <path d="M11.9387 17.7794L9.6416 21.2407L17.7475 21.6142L17.4611 12.9151L11.9387 17.7794Z" fill="#E27625"/>
                <path d="M28.0656 17.7794L22.4464 12.8271L22.2568 21.6142L30.3627 21.2407L28.0656 17.7794Z" fill="#E27625"/>
                <path d="M12.175 33.2685L16.8921 30.9812L12.8308 27.7364L12.175 33.2685Z" fill="#E27625"/>
                <path d="M23.1122 30.9812L27.825 33.2685L27.1735 27.7364L23.1122 30.9812Z" fill="#E27625"/>
              </svg>
              <span className="hidden sm:inline">Connect Wallet</span>
              <span className="inline sm:hidden">Connect</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default MetaMaskButton;
