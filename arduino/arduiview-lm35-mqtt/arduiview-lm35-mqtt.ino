#include <Adafruit_SleepyDog.h>
#include <Adafruit_CC3000.h>
#include <ccspi.h>
#include <SPI.h>
#include "utility/debug.h"
#include "Adafruit_MQTT.h"
#include "Adafruit_MQTT_CC3000.h"

#define CC3000_IRQ   3
#define CC3000_VBAT  5
#define CC3000_CS    10


// Security can be WLAN_SEC_UNSEC, WLAN_SEC_WEP, WLAN_SEC_WPA or WLAN_SEC_WPA2
#define WLAN_SECURITY   WLAN_SEC_WPA2
// cannot be longer than 32 characters!
#define WLAN_SSID       "HUAWEI-DevTech"
// For connecting router or AP, don't forget to set the SSID and password here!!
#define WLAN_PASS       "Autodesk123"


/************************* mqtt server setup *********************************/
// http://www.cloudmqtt.com 


#define AIO_SERVER      "m11.cloudmqtt.com"
#define AIO_SERVERPORT  15521
#define AIO_USERNAME    "danieldu"
#define AIO_KEY         "Autodesk123"

// Store the MQTT server, username, and password in flash memory.
// This is required for using the Adafruit MQTT library.
const char MQTT_SERVER[] PROGMEM    = AIO_SERVER;
const char MQTT_USERNAME[] PROGMEM  = AIO_USERNAME;
const char MQTT_PASSWORD[] PROGMEM  = AIO_KEY;



//The sensor id in mongoDB, currently we have only one sensor
#define SENSOR_ID "561083be06dd6162658ae8c8"

Adafruit_CC3000 cc3000 = Adafruit_CC3000(
                           CC3000_CS,
                           CC3000_IRQ,
                           CC3000_VBAT,
                           SPI_CLOCK_DIVIDER); // you can change this clock speed


// Setup the CC3000 MQTT class by passing in the CC3000 class and MQTT server and login details.
Adafruit_MQTT_CC3000 mqtt(&cc3000, MQTT_SERVER, AIO_SERVERPORT, MQTT_USERNAME, MQTT_PASSWORD);


// You don't need to change anything below this line!
#define halt(s) { Serial.println(F( s )); while(1);  }


/****************************** Feeds ***************************************/

// Setup a feed called 'temperature-center' for publishing.
const char TEMPERATURE_FEED[] PROGMEM = "temperature-center";
Adafruit_MQTT_Publish photocell = Adafruit_MQTT_Publish(&mqtt, TEMPERATURE_FEED);


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






    // Make sure to reset watchdog every loop iteration!
    Watchdog.reset();

    // Ensure the connection to the MQTT server is alive (this will make the first
    // connection and automatically reconnect when disconnected).  See the MQTT_connect
    // function definition further below.
    MQTT_connect();


    //get temperature value
    float temp = 0.0;
    // get the current temperature from sensor
    int reading = analogRead(0);
    temp = reading * 0.0048828125 * 100;
    Serial.print(F("Current temp"));
    Serial.println(temp);


    // Now we can publish stuff!
    Serial.print(F("\nSending temperature val "));
    Serial.print(temp);
    Serial.print("...");
    if (! photocell.publish(temp)) {
      Serial.println(F("Failed"));
    } else {
      Serial.println(F("OK!"));
    }
  
    // ping the server to keep the mqtt connection alive
    if(! mqtt.ping()) {
      Serial.println(F("MQTT Ping failed."));
    } 


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


  //Serial.println("\nDHCP is OK");


  Serial.println("Initialization completed.\n");

}



// Function to connect and reconnect as necessary to the MQTT server.
// Should be called in the loop function and it will take care if connecting.
void MQTT_connect() {
  int8_t ret;

  // Stop if already connected.
  if (mqtt.connected()) {
    return;
  }

  Serial.print("Connecting to MQTT... ");

  while ((ret = mqtt.connect()) != 0) { // connect will return 0 for connected
       Serial.println(mqtt.connectErrorString(ret));
       if (ret < 0){
            //lets connect to wifi again
            initWifiConnection();
       }
       Serial.println("Retrying MQTT connection in 5 seconds...");
       mqtt.disconnect();
       delay(5000);  // wait 5 seconds
  }
  Serial.println("MQTT Connected!");
}


