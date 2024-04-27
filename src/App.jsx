import { useState, useEffect } from "react";
import Web3 from "web3";
import axios from "axios";
import { NFT_ABI, NFT_ADDRESS } from "../constants/index";
import "./App.css";

const App = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState("");
  const [motto, setMotto] = useState("");
  const [energy, setEnergy] = useState(0);
  const [nftId, setNFTId] = useState(0);
  const [file, setFile] = useState("");
  const [nftName, setNftName] = useState("");
  const [nftDescription, setNftDescription] = useState("");

  useEffect(() => {
    const loadWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const accounts = await web3Instance.eth.getAccounts();
          setAccount(accounts[0]);
        } catch (error) {
          console.error("User denied account access");
        }
      } else {
        console.error("MetaMask not detected");
      }
    };
    loadWeb3();
  }, []);

  const uploadNft = async (e) => {
    e.preventDefault();
    try {
      const fileData = new FormData();
      fileData.append("file", file);
      if (!motto || !energy || !file || !nftName || !nftDescription) {
        alert("Please enter all the params!");
        return;
      }

      const imageUrl = await axios({
        method: "post",
        url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
        data: fileData,
        headers: {
          pinata_api_key: import.meta.env.VITE_PINATA_API_KEY,
          pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET_KEY,
          "Content-Type": "multipart/form-data",
        },
      });
      const imagehash = "ipfs://" + imageUrl.data.IpfsHash;
      //console.log(`Your image Hash is : ${imagehash}`);
 
      const nftMetaData = {
        name: nftName,
        description: nftDescription,
        image: imagehash,
        attributes: [
          {
            trait_type: "project-type",
            value: "gaming",
          },
          {
            trait_type: "location",
            value: "US",
          },
          {
            trait_type: "motto",
            value: motto,
          },
          {
            trait_type: "energy",
            value: energy,
          },
        ],
      };

      const responseData = await axios({
        method: "post",
        url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        data: nftMetaData,
        headers: {
          pinata_api_key: import.meta.env.VITE_PINATA_API_KEY,
          pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET_KEY,
          "Content-Type": "application/json",
        },
      });
      const fileUrl =
        "https://gateway.pinata.cloud/ipfs/" + responseData.data.IpfsHash;
      //console.log(`Your NFT has been uploaded to : ${fileUrl}`);
      const nftInstance = new web3.eth.Contract(NFT_ABI, NFT_ADDRESS);
      const txn = await nftInstance.methods
        .mintNFT(account, fileUrl)
        .send({ from: account });
      const nftID = txn.events.MetadataUpdate.returnValues[0];
      setNFTId(nftID);
      alert("nft minted!");
    } catch (err) {
      console.error("Error minting NFT:", err);
    }
  };

  const checkOpenSeaUrl = () => {
    const url = `https://testnets.opensea.io/assets/sepolia/${NFT_ADDRESS}/${nftId}`;
    window.open(url, "_blank");
  };

  return (
    <div className="container">
      <div className="center-content">
        <h1>NFT Minting Gateway</h1>
        {account && <p>Connected Wallet: {account}</p>}
        <form>
        <div>
            <input
              type="text"
              className="text-box"
              placeholder="Enter your NFT name"
              onChange={(e) => setNftName(e.target.value)}
            />
          </div>
          <div>
            <input
              type="text"
              className="text-box"
              placeholder="Enter nft description"
              onChange={(e) => setNftDescription(e.target.value)}
            />
          </div>
          <div>
            <input
              type="file"
              className="text-box"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>
          <div>
            <input
              type="text"
              className="text-box"
              placeholder="Enter your motto here"
              onChange={(e) => setMotto(e.target.value)}
            />
          </div>
          <div>
            <input
              type="text"
              className="text-box"
              placeholder="Enter energy amount"
              onChange={(e) => setEnergy(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="button mint-button"
            onClick={uploadNft}
          >
            Mint NFT
          </button>
          <button
            type="submit"
            className="button check-button"
            onClick={checkOpenSeaUrl}
          >
            NFT URL
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
