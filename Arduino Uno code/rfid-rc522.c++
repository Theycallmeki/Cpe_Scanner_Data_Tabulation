#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 10
#define RST_PIN 9

MFRC522 rfid(SS_PIN, RST_PIN); // Create MFRC522 instance

// Function to get the snack name from UID
String getTagName(byte *uid, byte uidSize) {
  if (uidSize == 4 &&
      uid[0] == 0xE5 &&
      uid[1] == 0x5B &&
      uid[2] == 0xFB &&
      uid[3] == 0x03) {
    return "Piattos";
  }
  else if (uidSize == 4 &&
           uid[0] == 0x29 &&
           uid[1] == 0xE6 &&
           uid[2] == 0xC8 &&
           uid[3] == 0x01) {
    return "KitKat";
  }
  else if (uidSize == 4 &&
           uid[0] == 0x52 &&
           uid[1] == 0xB9 &&
           uid[2] == 0xF4 &&
           uid[3] == 0x4A) {
    return "Nova";
  }
  return "Unknown Tag";
}

void setup() {
  Serial.begin(9600);
  SPI.begin();           // Initialize SPI bus
  rfid.PCD_Init();       // Initialize MFRC522
  Serial.println("Place a tag on the reader...");
}

void loop() {
  // Look for a new card
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  // Get tag name
  String tagName = getTagName(rfid.uid.uidByte, rfid.uid.size);

  // Print the result
  Serial.print("Detected Tag: ");
  Serial.println(tagName);

  // Optional: print the UID in hex
  Serial.print("UID: ");
  for (byte i = 0; i < rfid.uid.size; i++) {
    Serial.print(rfid.uid.uidByte[i] < 0x10 ? " 0" : " ");
    Serial.print(rfid.uid.uidByte[i], HEX);
  }
  Serial.println();
  Serial.println();

  // Halt and stop encryption
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  delay(1000); // Small delay to prevent spam
}
