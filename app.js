process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const dotenv = require("dotenv")
dotenv.config()
const express = require('express');
const cors = require("cors")
const bodyParser = require('body-parser');
const axios = require('axios')
const app = express();
const port = process.env.PORT || 5000;
const server = require('http').createServer(app)


app.use(bodyParser.json())
app.use(cors());
app.get('/',(req,res)=>{
  res.send('api-backend')
})


app.get('/:userID', async(req, res) => {

  //getting employee id from salesforce
  // {!SFDC_Employee__c.EMP_ID__c}
  let data={
    "username":`${process.env.vettel}`,
    "password":`${process.env.racing}`
  }
  
    let token =await axios({
        method: 'post',
        url: 'https://iconnect.bcssys.com/iconnect/api/v1/sessions',
        data
      });
    token=await token.data
    token=token.authToken
    
    const config = {
        headers: { Authorization: `Bearer ${token}` },
       
    };
    let userID=req.params.userID
    
    const bodyParameters = {
      "key": 1,
      "iConnectSCSearchProps": [
        {
          "key": 2,
          "value": `${userID}`
        }
      ]
    }
   
    let scorecardSearch=await axios.post( 
      'https://iconnect.bcssys.com/iconnect/api/v1/scorecard',
      bodyParameters,
      config
    )
    scorecardSearch=await scorecardSearch.data;

    let scorecardArray = scorecardSearch.iConnectSCResultCategories.iConnectSCResultCategories
    let result=[];
    for (let i = 0; i < scorecardArray.length; i++) {
      const element = scorecardArray[i];
      if(element.name=="Personal Data Sheet"){
        let a=element.iConnectSCResultCategoryDocs
        if(a){
          for (let j = 0; j < a.length; j++) {
            const e1 = a[j];
            result.push(e1.resultId);
          }
        }
        
      }
      
    }

    if(result.length!==0){
      let len=result.length;
      let id=result[len-1];
      const url =`https://iconnect.bcssys.com/iconnect/api/v1/scorecard/download/${id}`

       axios.get( 
        `https://iconnect.bcssys.com/iconnect/api/v1/scorecard/download/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType:'stream'
       }
      ).then((response)=>{
       
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=file.pdf');
        response.data.pipe(res)
   
      }).catch((e)=>console.log(e))


    }else{
      res.send("no document found");
    }
  
})

server.listen(port, () => {
    console.log("Listening on port", port)
});


