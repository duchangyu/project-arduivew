var dbconfig = {

    //mongoDb
  db: process.env.MONGODB || process.env.MONGOLAB_URI || 'mongodb://localhost:27017/test'

}

module.exports =dbconfig ;