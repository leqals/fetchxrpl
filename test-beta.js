const express = require('express');
const app = express();
const { XrplClient } = require('xrpl-client')
const axios = require('axios');

const port = process.env.PORT || 3000;

app.get('/nft', (req, res) => {

  const client = new XrplClient();
  
  // Get the list of NFTs in the wallet address
  (async () => {


    try {

      // Get the list of nfts using send method from the xrpl-client lib
      let nfts = await client.send({
        "command": "account_nfts",
        "account": "rfdmLaLLtBzHUrq2SjtnZemY39XM9jPYwL",
        "ledger_index": "validated"
      });

      // account_nfts is not a method its a key
      nfts = nfts.account_nfts

      // Array to store the combined NFToken and NFTrait metadata
      let nftMetadata = [];

      // Loop through each NFTokenId and fetch its metadata

    
      nfts.map( async(nft) => {

        // get tokenId 
        const tokenId = nft.NFTokenID;

        // Fetch the NFToken metadata
        try {
          const nftokenResponse = await axios.get(`https://api.xrpldata.com/api/v1/xls20-nfts/nft/${tokenId}`);
          const nftokenData = nftokenResponse.data.nft;

          // If the NFToken has a URI field, decode it and fetch the NFTrait metadata
          if (nftokenData.URI) {
            try {
              const uri = Buffer.from(nftokenData.URI, 'hex').toString('utf8');
              const nftraitResponse = await axios.get(uri);
              const nftraitData = nftraitResponse.data;

              // Combine the NFToken and NFTrait metadata and add it to the array
              nftMetadata.push({
                nftoken: nftokenData,
                nftrait: nftraitData
              });
            } catch (error) {
              console.error(error);
            }
          } else {

            // If the NFToken does not have a URI field, fetch the metadata from the marketplace API
            try {
              const nftMetadataResponse = await axios.get(`https://marketplace-api.onxrp.com/api/metadata/${tokenId}`);

              const nftMetadataData = nftMetadataResponse.data;
              const nftImageData = nftMetadataData.image;

              // Combine the NFToken and NFTrait metadata and add it to the array
              nftMetadata.push({
                nftoken: {
                  ...nftokenData,
                  name: nftMetadataData.name,
                  image: nftImageData
                },
                nftrait: {}
              });
            } catch (error) {
              console.error(error);
            }
          }
        } catch (error) {
          console.error(error);
        }

      })
      // Return the array of combined NFToken and NFTrait metadata
      res.send(nftMetadata);
    } catch (error) {
      console.error(error);
    }
  })();
});

//API LISTEN
app.listen(port, () => {
  console.log(`XRarity listening on port ${port}`);
});
