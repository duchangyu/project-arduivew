#include <Adafruit_CC3000.h>
#include <Adafruit_CC3000_Server.h>
#include <ccspi.h>

/***************************************************
 * This is an example for the DFRobot Wido - Wifi Integrated IoT lite sensor and control node
 * Product Page & More info: http://www.dfrobot.com.cn/goods-997.html
 * Designed specifically to work with the DFRobot Wido products:
 *
 * The library is forked from Adafruit
 *
 * Written by Lauren
 * BSD license, all text above must be included in any redistribution
 *
 ****************************************************/

/*
This example code is used to connect the Yeelink cloud service (Official homepage: www.yeelink.net).

 The device required is just:

 1. LM35 low cost temperature sensor or any device you used to upload data
 2. And Wido

Note: Please don't forget to change the setting below before using!
 1. WLAN_SSID & WlAN_PASS
 2. API_key
 3. device ID & sensor ID

 */


#include <Adafruit_CC3000.h>
#include <ccspi.h>
#include <SPI.h>
#define Wido_IRQ   3
#define Wido_VBAT  5
#define Wido_CS    10

Adafruit_CC3000 Wido = Adafruit_CC3000(Wido_CS, Wido_IRQ, Wido_VBAT,
                                       SPI_CLOCK_DIVIDER); // you can change this clock speed

// Security can be WLAN_SEC_UNSEC, WLAN_SEC_WEP, WLAN_SEC_WPA or WLAN_SEC_WPA2
#define WLAN_SECURITY   WLAN_SEC_WPA2


#define WLAN_SSID       "xiaomi"           // cannot be longer than 32 characters!
#define WLAN_PASS       "18600503761"          // For connecting router or AP, don't forget to set the SSID and password here!!

#define DEVICE_ID       "561083be06dd6162658ae8c8"  //arduiview device id


#define TCP_TIMEOUT      3000
//#define CC3000_TINY_DRIVER

#define WEBSITE  "arduiview.herokuapp.com"


uint32_t ip = 0;
float temp = 0;


static Adafruit_CC3000_Client WidoClient;
static unsigned long RetryMillis = 0;
static unsigned long uploadtStamp = 0;
static unsigned long sensortStamp = 0;


void setup() {

  Serial.begin(115200);

  initWifiConnection();

}


void loop() {




  // ======= build the connectioin =========
  if (!WidoClient.connected() && millis() - RetryMillis > TCP_TIMEOUT) {
    // Update the time stamp
    RetryMillis = millis();

    Serial.println(F("Try to connect the cloud server"));
    WidoClient.close();

    // Get cloud server IP address
    Serial.print(WEBSITE);
    while  (ip  ==  0)  {
      if  (!Wido.getHostByName(WEBSITE, &ip))  {    //  Get the server IP address based on the domain name
        Serial.println(F("Couldn't resolve!"));
      }
      Serial.println(F("resolved IP failed, retrying...."));
      delay(500);

    }
    Wido.printIPdotsRev(ip);
    Serial.println(F(" IP resolved."));

    // Connect to the aruduiview Server
    WidoClient = Wido.connectTCP(ip, 80);          // Try to connect cloud server

    Serial.println(F("connected."));
  }


  //===========Upload data ========
  if (WidoClient.connected() && millis() - uploadtStamp > 2000) {   //upload every 2s
    uploadtStamp = millis();
    // If the device is connected to the cloud server, upload the data every 2000ms.

    Serial.println(F("Begin uploading...."));

    // Prepare Http Package for Yeelink & get length
    int length = 0;
    char lengthstr[3];

    // Create Http data package
    char httpPackage[] = "";

    strcat(httpPackage , "{\"value\": \"");

    //get temperature from sensor
    int reading = analogRead(0);
    temp = reading * 0.0048828125 * 100;
    Serial.print(F("Real Time Temp: "));
    Serial.println(temp);

    char sTemp[] = "";
    //convert float to char*, 
     //dtostrf(temp,2,2, sTemp); //val, integer part width, precise, result char array 
    itoa(temp, sTemp, 10);
    strcat(httpPackage , sTemp);    // push the data(temp) to the http data package
    strcat(httpPackage , "\" }");

    length = strlen(httpPackage);                           // get the length of data package
    itoa(length, lengthstr, 10);                            // convert int to char array for posting
    //Serial.print(F("Length = "));
    //Serial.println(length);

    // Send headers
    Serial.print(F("Sending headers"));

    WidoClient.fastrprint(F("PUT /api/sensors/"));
    char *deviceId = DEVICE_ID;
    WidoClient.fastrprint(deviceId);
    WidoClient.fastrprint(F("/values"));

    WidoClient.fastrprintln(F(" HTTP/1.1"));
    Serial.print(F("."));

    WidoClient.fastrprintln(F("Host: arduiview.herokuapp.com"));
    Serial.print(F("."));

    WidoClient.fastrprint(F("content-type: "));
    WidoClient.fastrprintln("application/json");
    Serial.print(F("."));

    WidoClient.fastrprint("Content-Length: ");
    WidoClient.fastrprintln(lengthstr);
    WidoClient.fastrprintln("");
    Serial.print(F("."));

    Serial.println(F(" done."));

    // Send data
    Serial.print(F("Sending data"));

    //char payload[600] = "";
    //strcat(payload,httpPackage);
    WidoClient.fastrprintln(httpPackage);

    //Serial.println(F("-----"));
    //Serial.println(httpPackage);
    //Serial.println(F("-----"));

    Serial.println(F(" done."));

    /********** Get the http page feedback ***********/

    unsigned long rTimer = millis();
    Serial.println(F("Reading Cloud Response!!!\r\n"));
    while (millis() - rTimer < 2000) {
      while (WidoClient.connected() && WidoClient.available()) {
        char c = WidoClient.read();
        Serial.print(c);
      }
    }
    delay(1000);             // Wait for 1s to finish posting the data stream
    WidoClient.close();      // Close the service connection

   }


  //  //read temperature every 0.1 seconds
  //  if (millis() - sensortStamp > 100) {
  //    sensortStamp = millis();
  //    // read the LM35 sensor value and convert to the degrees every 100ms.
  //
  //    int reading = analogRead(0);
  //    temp = reading * 0.0048828125 * 100;
  //    Serial.print(F("Real Time Temp: "));
  //    Serial.println(temp);
  //  }
}



void initWifiConnection() {

  /* Initialise the module */
  Serial.println(F("\nInitialising the CC3000 ..."));
  if (!Wido.begin())
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
  if (!Wido.connectToAP(WLAN_SSID, WLAN_PASS, WLAN_SECURITY)) {
    Serial.println(F("Failed!"));
    while (1);
  }

  Serial.println(F("Connected to WIFI!"));

  /* Wait for DHCP to complete */
  Serial.println(F("Request DHCP"));
  while (!Wido.checkDHCP())
  {
    delay(1000); // ToDo: Insert a DHCP timeout!
  }


}









