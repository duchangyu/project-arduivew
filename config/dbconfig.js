var dbconfig = {

    //mongoDb
  db: process.env.MONGODB || process.env.MONGOLAB_URI || 'mongodb://localhost:27017/test',



  cloudmqtt_url : process.env.CLOUDMQTT_URL || 'mqtt://m11.cloudmqtt.com : 15521',
  cloudmqtt_username : 'danieldu',
  cloudmqtt_password : '1q2w3e4r'

}



module.exports =dbconfig ;