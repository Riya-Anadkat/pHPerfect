## backend for database
npm i  
node server.js  

brew install mysql  
brew services start mysql  
mysql -h localhost -P 3307  -u root
USE ph_database
select * from ph_readings;


## backend for ML
pip install -r requirements.txt  
python3 server.py

allow permisions:
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off