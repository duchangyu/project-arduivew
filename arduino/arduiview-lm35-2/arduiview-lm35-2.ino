
#include <Adafruit_CC3000.h>
#include <ccspi.h>
#include <SPI.h>


#define CC3000_IRQ   3
#define CC3000_VBAT  5
#define CC3000_CS    10


// Security can be WLAN_SEC_UNSEC, WLAN_SEC_WEP, WLAN_SEC_WPA or WLAN_SEC_WPA2
#define WLAN_SECURITY   WLAN_SEC_WPA2
// cannot be longer than 32 characters!
#define WLAN_SSID       "HUAWEI-DevTech"
// For connecting router or AP, don't forget to set the SSID and password here!!
#define WLAN_PASS       "Autodesk123"

#define WEBSITE  "arduiview.herokuapp.com"

//The sensor id in mongoDB, currently we have only one sensor
#define SENSOR_ID "561083be06dd6162658ae8c8"

Adafruit_CC3000 cc3000 = Adafruit_CC3000(
                           CC3000_CS,
                           CC3000_IRQ,
                           CC3000_VBAT,
                           SPI_CLOCK_DIVIDER); // you can change this clock speed



static Adafruit_CC3000_Client client;


uint32_t ip = 0;

unsigned long lastConnectionTime = 0;            // last time you connected to the server, in milliseconds
const unsigned long postingInterval = 5L * 1000L; // delay between updates, in milliseconds

unsigned long lastConnectWifiTime = 0;
const unsigned long checkNetworkInterval = 30L * 1000L * 60L; //reconnect WIFI every 20 min

void setup() {

  Serial.begin(115200);

  initWifiConnection();
}

void loop() {

  if (millis() - lastConnectWifiTime > checkNetworkInterval) {

    initWifiConnection();

    lastConnectWifiTime = millis();
  }


  if ( millis() - lastConnectionTime > postingInterval) {

    postTemperatureToCloudServer();

    // note the time of last uploading
    lastConnectionTime = millis() ;

  }

}



void postTemperatureToCloudServer() {



  //connectToCloudServer
  Serial.println(F("trying to connect to cloud server....."));
  //client.close();
  client = cc3000.connectTCP(ip, 80);

  Serial.println(F("connected to cloud server - "));
  Serial.println(WEBSITE );

  Serial.println(F("begin uploading..."));

  float temp = 0.0;
  // get the current temperature from sensor
  int reading = analogRead(0);
  temp = reading * 0.0048828125 * 100;
  Serial.print(F("Current temp"));
  Serial.println(temp);


  int length;
  char sTemp[5] = "";
  //convert float to char*,
  dtostrf(temp, 2, 2, sTemp); //val, integer part width, precise, result char array
  //itoa(temp, sTemp,10);
  Serial.println(sTemp);


  char sLength[3];


  //prepare the http body
  //
  //{
  //  "value" : 55.23
  //}
  //


  char httpPackage[20] = "";

  strcat(httpPackage, "{\"value\": \"");
  strcat(httpPackage, sTemp);
  strcat(httpPackage, "\" }");

  // get the length of data package
  length = strlen(httpPackage);
  // convert int to char array for posting
  itoa(length, sLength, 10);
  Serial.print(F("body lenght="));
  Serial.println(sLength);





  //prepare the http header
  Serial.println(F("Sending headers..."));

  client.fastrprint(F("PUT /api/sensors/"));
  char *sensorId = SENSOR_ID;
  client.fastrprint(sensorId);
  //client.fastrprint(SENSOR_ID);
  client.fastrprint(F("/values"));

  client.fastrprintln(F(" HTTP/1.1"));
  Serial.print(F("."));

  client.fastrprint(F("Host: "));
  client.fastrprintln(WEBSITE);
  Serial.print(F("."));

  client.fastrprint(F("content-type: "));
  client.fastrprintln(F("application/json"));
  Serial.print(F("."));

  client.fastrprint(F("Content-Length: "));
  client.fastrprintln(sLength);
  client.fastrprintln(F(""));
  Serial.print(F("."));

  Serial.println(F("header done."));

  //send data
  Serial.println(F("Sending data"));
  client.fastrprintln(httpPackage);


  Serial.println(F("===upload completed."));



  // Get the http page feedback

  unsigned long rTimer = millis();
  Serial.println(F("Reading Cloud Response!!!\r\n"));
  while (millis() - rTimer < 2000) {
    while (client.connected() && client.available()) {
      char c = client.read();
      Serial.print(c);
    }
  }
  delay(1000);             // Wait for 1s to finish posting the data stream
  client.close();      // Close the service connection

  /*
    */

  Serial.println(F("upload completed\n"));





}




void initWifiConnection()
{


  /* Initialise the module */
  //Serial.println(F("\nInitialising the CC3000 ..."));
  if (!cc3000.begin())
  {
    Serial.println(F("Unable to initialise the CC3000! Check your wiring?"));
    while (1);
  }

  /* Attempt to connect to an access point */
  char *ssid = WLAN_SSID;             /* Max 32 chars */
  Serial.print(F("\nAttempting to connect to "));
  Serial.println(ssid);

  /* NOTE: Secure connections are not available in 'Tiny' mode!
   By default connectToAP will retry indefinitely, however you can pass an
   optional maximum number of retries (greater than zero) as the fourth parameter.
   */
  if (!cc3000.connectToAP(WLAN_SSID, WLAN_PASS, WLAN_SECURITY)) {
    Serial.println(F("Failed!"));
    while (1);
  }


  //Serial.println("\nconnected to WIFI.");

  /* Wait for DHCP to complete */
  //Serial.println("\nRequest DHCP");
  while (!cc3000.checkDHCP())
  {
    delay(1000); // ToDo: Insert a DHCP timeout!
  }


  // Try looking up the website's IP address
  Serial.print(WEBSITE); Serial.print(F(" -> "));
  while (ip == 0) {
    if (! cc3000.getHostByName(WEBSITE, &ip)) {
      Serial.println(F("Couldn't resolve!"));
    }
    delay(500);
  }

  cc3000.printIPdotsRev(ip);


  //Serial.println("\nDHCP is OK");


  Serial.println("Initialization completed.\n");

}



