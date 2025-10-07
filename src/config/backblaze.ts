const B2 = require('backblaze-b2');

const b2 = new B2({
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
});

let authData : any = null ;

const authorizeB2 = async () => {
  try {
    if (!authData ) {
      authData = await b2.authorize();
    }
    return authData;
  } catch (error) {
    console.error('B2 Authorization failed:', error);
    throw error;
  }
};

module.exports = { b2, authorizeB2 };