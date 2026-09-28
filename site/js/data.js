/* Tapographer game data: places, stories, cities, mountain ranges, painted biomes. */
const PLACES = [
// USA
["New York City","New York",40.71,-74.01,"city","us"],["Los Angeles","California",34.05,-118.24,"city","us"],
["Chicago","Illinois",41.88,-87.63,"city","us"],["Houston","Texas",29.76,-95.37,"city","us"],
["Phoenix","Arizona",33.45,-112.07,"city","us"],["Philadelphia","Pennsylvania",39.95,-75.17,"city","us"],
["San Antonio","Texas",29.42,-98.49,"city","us"],["San Diego","California",32.72,-117.16,"city","us"],
["Dallas","Texas",32.78,-96.80,"city","us"],["Austin","Texas",30.27,-97.74,"city","us"],
["Seattle","Washington",47.61,-122.33,"city","us"],["Denver","Colorado",39.74,-104.99,"city","us"],
["Boston","Massachusetts",42.36,-71.06,"city","us"],["Nashville","Tennessee",36.16,-86.78,"city","us"],
["Portland","Oregon",45.52,-122.68,"city","us"],["Las Vegas","Nevada",36.17,-115.14,"city","us"],
["Miami","Florida",25.76,-80.19,"city","us"],["Atlanta","Georgia",33.75,-84.39,"city","us"],
["New Orleans","Louisiana",29.95,-90.07,"city","us"],["Minneapolis","Minnesota",44.98,-93.27,"city","us"],
["Detroit","Michigan",42.33,-83.05,"city","us"],["Salt Lake City","Utah",40.76,-111.89,"city","us"],
["Kansas City","Missouri",39.10,-94.58,"city","us"],["St. Louis","Missouri",38.63,-90.20,"city","us"],
["Pittsburgh","Pennsylvania",40.44,-79.99,"city","us"],["Charlotte","North Carolina",35.23,-80.84,"city","us"],
["Albuquerque","New Mexico",35.08,-106.65,"city","us"],["Boise","Idaho",43.62,-116.20,"city","us"],
["Omaha","Nebraska",41.26,-95.93,"city","us"],["Memphis","Tennessee",35.15,-90.05,"city","us"],
["Louisville","Kentucky",38.25,-85.76,"city","us"],["Cleveland","Ohio",41.50,-81.69,"city","us"],
["Milwaukee","Wisconsin",43.04,-87.91,"city","us"],["Tucson","Arizona",32.22,-110.97,"city","us"],
["Sacramento","California",38.58,-121.49,"city","us"],["San Francisco","California",37.77,-122.42,"city","us"],
["Hartford","Connecticut",41.76,-72.69,"city","us"],["Providence","Rhode Island",41.82,-71.41,"city","us"],
["Portland","Maine",43.66,-70.26,"city","us"],["Burlington","Vermont",44.48,-73.21,"city","us"],
["Buffalo","New York",42.89,-78.88,"city","us"],["Richmond","Virginia",37.54,-77.44,"city","us"],
["Washington","District of Columbia",38.90,-77.04,"cap","us"],["Savannah","Georgia",32.08,-81.09,"city","us"],
["Charleston","South Carolina",32.78,-79.93,"city","us"],["Tampa","Florida",27.95,-82.46,"city","us"],
["Key West","Florida",24.56,-81.78,"city","us"],["Oklahoma City","Oklahoma",35.47,-97.52,"city","us"],
["Little Rock","Arkansas",34.75,-92.29,"city","us"],["Des Moines","Iowa",41.59,-93.62,"city","us"],
["Fargo","North Dakota",46.88,-96.79,"city","us"],["Sioux Falls","South Dakota",43.54,-96.73,"city","us"],
["Billings","Montana",45.78,-108.50,"city","us"],["Cheyenne","Wyoming",41.14,-104.82,"city","us"],
["Spokane","Washington",47.66,-117.43,"city","us"],["Reno","Nevada",39.53,-119.81,"city","us"],
["El Paso","Texas",31.76,-106.49,"city","us"],["Birmingham","Alabama",33.52,-86.80,"city","us"],
["Jackson","Mississippi",32.30,-90.18,"city","us"],["Indianapolis","Indiana",39.77,-86.16,"city","us"],
["Columbus","Ohio",39.96,-83.00,"city","us"],["Madison","Wisconsin",43.07,-89.40,"city","us"],
["Grand Canyon","Arizona",36.06,-112.14,"nat","us"],["Mount Rushmore","South Dakota",43.88,-103.46,"mark","us"],
["Old Faithful","Wyoming",44.46,-110.83,"nat","us"],["Yosemite Valley","California",37.75,-119.59,"nat","us"],
["Niagara Falls","New York",43.08,-79.07,"nat","us"],["Kennedy Space Center","Florida",28.57,-80.65,"mark","us"],
["Mount Rainier","Washington",46.85,-121.76,"nat","us"],["Clingmans Dome","Tennessee",35.56,-83.50,"nat","us"],
["Arches National Park","Utah",38.73,-109.59,"nat","us"],["Everglades","Florida",25.14,-80.92,"nat","us"],
["Acadia National Park","Maine",44.34,-68.27,"nat","us"],["Lake Tahoe","California / Nevada",39.10,-120.03,"nat","us"],
["Provincetown","Massachusetts",42.05,-70.19,"city","us"],["Death Valley","California",36.23,-116.77,"nat","us"],
["Mount St. Helens","Washington",46.19,-122.19,"nat","us"],["Crater Lake","Oregon",42.94,-122.11,"nat","us"],
["Pikes Peak","Colorado",38.84,-105.04,"nat","us"],["Devils Tower","Wyoming",44.59,-104.72,"nat","us"],
["Baseball Hall of Fame","Cooperstown, New York",42.70,-74.92,"mark","us"],["Augusta National","Georgia",33.50,-82.02,"mark","us"],
["Pebble Beach","California",36.57,-121.95,"mark","us"],["Lambeau Field","Green Bay, Wisconsin",44.50,-88.06,"mark","us"],
["Honolulu","Hawaii",21.31,-157.86,"city","usx"],["Anchorage","Alaska",61.22,-149.90,"city","usx"],["Denali","Alaska",63.07,-151.01,"nat","usx"],
// Europe
["London","United Kingdom",51.51,-0.13,"cap","eu"],["Paris","France",48.86,2.35,"cap","eu"],["Berlin","Germany",52.52,13.40,"cap","eu"],
["Madrid","Spain",40.42,-3.70,"cap","eu"],["Rome","Italy",41.90,12.50,"cap","eu"],["Lisbon","Portugal",38.72,-9.14,"cap","eu"],
["Dublin","Ireland",53.35,-6.26,"cap","eu"],["Edinburgh","Scotland",55.95,-3.19,"city","eu"],["Amsterdam","Netherlands",52.37,4.90,"cap","eu"],
["Brussels","Belgium",50.85,4.35,"cap","eu"],["Luxembourg","Luxembourg",49.61,6.13,"cap","eu"],["Bern","Switzerland",46.95,7.45,"cap","eu"],
["Vienna","Austria",48.21,16.37,"cap","eu"],["Prague","Czechia",50.08,14.44,"cap","eu"],["Warsaw","Poland",52.23,21.01,"cap","eu"],
["Budapest","Hungary",47.50,19.04,"cap","eu"],["Bratislava","Slovakia",48.15,17.11,"cap","eu"],["Ljubljana","Slovenia",46.06,14.51,"cap","eu"],
["Zagreb","Croatia",45.81,15.98,"cap","eu"],["Belgrade","Serbia",44.79,20.45,"cap","eu"],["Sarajevo","Bosnia and Herzegovina",43.86,18.41,"cap","eu"],
["Podgorica","Montenegro",42.44,19.26,"cap","eu"],["Tirana","Albania",41.33,19.82,"cap","eu"],["Skopje","North Macedonia",41.99,21.43,"cap","eu"],
["Sofia","Bulgaria",42.70,23.32,"cap","eu"],["Bucharest","Romania",44.43,26.10,"cap","eu"],["Chișinău","Moldova",47.01,28.86,"cap","eu"],
["Kyiv","Ukraine",50.45,30.52,"cap","eu"],["Minsk","Belarus",53.90,27.57,"cap","eu"],["Vilnius","Lithuania",54.69,25.28,"cap","eu"],
["Riga","Latvia",56.95,24.11,"cap","eu"],["Tallinn","Estonia",59.44,24.75,"cap","eu"],["Helsinki","Finland",60.17,24.94,"cap","eu"],
["Stockholm","Sweden",59.33,18.07,"cap","eu"],["Oslo","Norway",59.91,10.75,"cap","eu"],["Copenhagen","Denmark",55.68,12.57,"cap","eu"],
["Reykjavík","Iceland",64.15,-21.94,"cap","eu"],["Athens","Greece",37.98,23.73,"cap","eu"],["Valletta","Malta",35.90,14.51,"cap","eu"],
["Barcelona","Spain",41.39,2.17,"city","eu"],["Seville","Spain",37.39,-5.98,"city","eu"],["Porto","Portugal",41.15,-8.61,"city","eu"],
["Marseille","France",43.30,5.37,"city","eu"],["Lyon","France",45.76,4.84,"city","eu"],["Bordeaux","France",44.84,-0.58,"city","eu"],
["Munich","Germany",48.14,11.58,"city","eu"],["Hamburg","Germany",53.55,9.99,"city","eu"],["Frankfurt","Germany",50.11,8.68,"city","eu"],
["Zürich","Switzerland",47.38,8.54,"city","eu"],["Milan","Italy",45.46,9.19,"city","eu"],["Venice","Italy",45.44,12.32,"city","eu"],
["Naples","Italy",40.85,14.27,"city","eu"],["Florence","Italy",43.77,11.26,"city","eu"],["Palermo","Italy",38.12,13.36,"city","eu"],
["Kraków","Poland",50.06,19.94,"city","eu"],["Manchester","England",53.48,-2.24,"city","eu"],["Belfast","Northern Ireland",54.60,-5.93,"city","eu"],
["Cardiff","Wales",51.48,-3.18,"cap","eu"],["Bergen","Norway",60.39,5.32,"city","eu"],["Gothenburg","Sweden",57.71,11.97,"city","eu"],
["St. Petersburg","Russia",59.93,30.34,"city","eu"],["Moscow","Russia",55.76,37.62,"cap","eu"],["Istanbul","Türkiye",41.01,28.98,"city","eu"],
["Stonehenge","England",51.18,-1.83,"mark","eu"],["Mont-Saint-Michel","France",48.64,-1.51,"mark","eu"],["Matterhorn","Switzerland / Italy",45.98,7.66,"nat","eu"],
["Neuschwanstein Castle","Germany",47.56,10.75,"mark","eu"],["Santorini","Greece",36.39,25.46,"nat","eu"],["Cliffs of Moher","Ireland",52.97,-9.43,"nat","eu"],
["Dubrovnik","Croatia",42.65,18.09,"city","eu"],["Loch Ness","Scotland",57.32,-4.42,"nat","eu"],["Geirangerfjord","Norway",62.10,7.09,"nat","eu"],
["Mount Etna","Sicily, Italy",37.75,14.99,"nat","eu"],["St Andrews Old Course","Scotland",56.34,-2.80,"mark","eu"],["North Cape","Norway",71.17,25.78,"nat","eu"],
["Gibraltar","British Overseas Territory",36.14,-5.35,"mark","eu"],["Mont Blanc","France / Italy",45.83,6.86,"nat","eu"],
// Asia & Middle East
["Tokyo","Japan",35.68,139.69,"cap","as"],["Osaka","Japan",34.69,135.50,"city","as"],["Sapporo","Japan",43.06,141.35,"city","as"],
["Seoul","South Korea",37.57,126.98,"cap","as"],["Busan","South Korea",35.18,129.08,"city","as"],["Pyongyang","North Korea",39.04,125.76,"cap","as"],
["Beijing","China",39.90,116.41,"cap","as"],["Shanghai","China",31.23,121.47,"city","as"],["Hong Kong","China",22.32,114.17,"city","as"],
["Chengdu","China",30.57,104.07,"city","as"],["Xi'an","China",34.34,108.94,"city","as"],["Harbin","China",45.80,126.53,"city","as"],
["Lhasa","Tibet, China",29.65,91.12,"city","as"],["Ürümqi","Xinjiang, China",43.83,87.62,"city","as"],["Taipei","Taiwan",25.03,121.57,"city","as"],
["Ulaanbaatar","Mongolia",47.89,106.91,"cap","as"],["Manila","Philippines",14.60,120.98,"cap","as"],["Hanoi","Vietnam",21.03,105.85,"cap","as"],
["Ho Chi Minh City","Vietnam",10.82,106.63,"city","as"],["Bangkok","Thailand",13.76,100.50,"cap","as"],["Phnom Penh","Cambodia",11.56,104.92,"cap","as"],
["Vientiane","Laos",17.97,102.63,"cap","as"],["Yangon","Myanmar",16.84,96.17,"city","as"],["Kuala Lumpur","Malaysia",3.14,101.69,"cap","as"],
["Singapore","Singapore",1.35,103.82,"cap","as"],["Jakarta","Indonesia",-6.21,106.85,"cap","as"],["Bali","Indonesia",-8.65,115.22,"nat","as"],
["New Delhi","India",28.61,77.21,"cap","as"],["Mumbai","India",19.08,72.88,"city","as"],["Kolkata","India",22.57,88.36,"city","as"],
["Chennai","India",13.08,80.27,"city","as"],["Bengaluru","India",12.97,77.59,"city","as"],["Kathmandu","Nepal",27.72,85.32,"cap","as"],
["Dhaka","Bangladesh",23.81,90.41,"cap","as"],["Colombo","Sri Lanka",6.93,79.86,"city","as"],["Karachi","Pakistan",24.86,67.01,"city","as"],
["Islamabad","Pakistan",33.68,73.05,"cap","as"],["Kabul","Afghanistan",34.56,69.21,"cap","as"],["Tashkent","Uzbekistan",41.30,69.24,"cap","as"],
["Almaty","Kazakhstan",43.24,76.95,"city","as"],["Tehran","Iran",35.69,51.39,"cap","as"],["Baghdad","Iraq",33.31,44.36,"cap","as"],
["Riyadh","Saudi Arabia",24.71,46.68,"cap","as"],["Dubai","United Arab Emirates",25.20,55.27,"city","as"],["Doha","Qatar",25.29,51.53,"cap","as"],
["Muscat","Oman",23.59,58.41,"cap","as"],["Jerusalem","Israel",31.77,35.21,"city","as"],["Amman","Jordan",31.95,35.93,"cap","as"],
["Beirut","Lebanon",33.89,35.50,"cap","as"],["Damascus","Syria",33.51,36.28,"cap","as"],["Ankara","Türkiye",39.93,32.86,"cap","as"],
["Tbilisi","Georgia",41.72,44.78,"cap","as"],["Yerevan","Armenia",40.18,44.51,"cap","as"],["Baku","Azerbaijan",40.41,49.87,"cap","as"],
["Malé","Maldives",4.18,73.51,"cap","as"],["Mount Everest","Nepal / China",27.99,86.93,"nat","as"],["Taj Mahal","Agra, India",27.18,78.04,"mark","as"],
["Angkor Wat","Cambodia",13.41,103.87,"mark","as"],["Mount Fuji","Japan",35.36,138.73,"nat","as"],["Petra","Jordan",30.33,35.44,"mark","as"],
["Ha Long Bay","Vietnam",20.91,107.18,"nat","as"],["Borobudur","Java, Indonesia",-7.61,110.20,"mark","as"],["Mecca","Saudi Arabia",21.42,39.83,"city","as"],
["Hiroshima","Japan",34.39,132.46,"city","as"],["Samarkand","Uzbekistan",39.65,66.96,"city","as"],["Lake Baikal","Siberia, Russia",51.85,104.87,"nat","as"],
["Vladivostok","Russia",43.12,131.89,"city","as"],["Novosibirsk","Russia",55.01,82.93,"city","as"],
// Africa
["Cairo","Egypt",30.04,31.24,"cap","af"],["Luxor","Egypt",25.69,32.64,"city","af"],["Alexandria","Egypt",31.20,29.92,"city","af"],
["Tripoli","Libya",32.89,13.19,"cap","af"],["Tunis","Tunisia",36.81,10.18,"cap","af"],["Algiers","Algeria",36.75,3.06,"cap","af"],
["Casablanca","Morocco",33.57,-7.59,"city","af"],["Marrakesh","Morocco",31.63,-8.01,"city","af"],["Dakar","Senegal",14.72,-17.47,"cap","af"],
["Bamako","Mali",12.64,-8.00,"cap","af"],["Timbuktu","Mali",16.77,-3.01,"city","af"],["Niamey","Niger",13.51,2.11,"cap","af"],
["Accra","Ghana",5.60,-0.19,"cap","af"],["Lagos","Nigeria",6.52,3.38,"city","af"],["Abuja","Nigeria",9.08,7.40,"cap","af"],
["Kinshasa","DR Congo",-4.44,15.27,"cap","af"],["Luanda","Angola",-8.84,13.23,"cap","af"],["Nairobi","Kenya",-1.29,36.82,"cap","af"],
["Addis Ababa","Ethiopia",9.03,38.74,"cap","af"],["Khartoum","Sudan",15.50,32.56,"cap","af"],["Kampala","Uganda",0.35,32.58,"cap","af"],
["Kigali","Rwanda",-1.95,30.06,"cap","af"],["Dar es Salaam","Tanzania",-6.79,39.21,"city","af"],["Mogadishu","Somalia",2.05,45.32,"cap","af"],
["Djibouti","Djibouti",11.59,43.15,"cap","af"],["Asmara","Eritrea",15.32,38.93,"cap","af"],["Lusaka","Zambia",-15.39,28.32,"cap","af"],
["Harare","Zimbabwe",-17.83,31.05,"cap","af"],["Maputo","Mozambique",-25.97,32.57,"cap","af"],["Johannesburg","South Africa",-26.20,28.05,"city","af"],
["Cape Town","South Africa",-33.92,18.42,"city","af"],["Durban","South Africa",-29.86,31.02,"city","af"],["Windhoek","Namibia",-22.56,17.08,"cap","af"],
["Gaborone","Botswana",-24.63,25.92,"cap","af"],["Antananarivo","Madagascar",-18.88,47.51,"cap","af"],["Abidjan","Côte d'Ivoire",5.36,-4.01,"city","af"],
["Freetown","Sierra Leone",8.48,-13.23,"cap","af"],["Monrovia","Liberia",6.30,-10.80,"cap","af"],["Douala","Cameroon",4.05,9.77,"city","af"],
["N'Djamena","Chad",12.13,15.06,"cap","af"],["Mount Kilimanjaro","Tanzania",-3.07,37.36,"nat","af"],["Victoria Falls","Zambia / Zimbabwe",-17.92,25.86,"nat","af"],
["Serengeti","Tanzania",-2.43,34.82,"nat","af"],["Okavango Delta","Botswana",-19.28,22.90,"nat","af"],["Sossusvlei dunes","Namibia",-24.73,15.29,"nat","af"],
["Lalibela","Ethiopia",12.03,39.04,"mark","af"],["Abu Simbel","Egypt",22.34,31.63,"mark","af"],
// Americas (outside the US)
["Toronto","Ontario, Canada",43.65,-79.38,"city","am"],["Montreal","Quebec, Canada",45.50,-73.57,"city","am"],["Vancouver","British Columbia, Canada",49.28,-123.12,"city","am"],
["Ottawa","Canada",45.42,-75.70,"cap","am"],["Calgary","Alberta, Canada",51.05,-114.07,"city","am"],["Winnipeg","Manitoba, Canada",49.90,-97.14,"city","am"],
["Halifax","Nova Scotia, Canada",44.65,-63.57,"city","am"],["Quebec City","Quebec, Canada",46.81,-71.21,"city","am"],["St. John's","Newfoundland, Canada",47.56,-52.71,"city","am"],
["Yellowknife","Northwest Territories, Canada",62.45,-114.37,"city","am"],["Whitehorse","Yukon, Canada",60.72,-135.06,"city","am"],["Iqaluit","Nunavut, Canada",63.75,-68.52,"city","am"],
["Mexico City","Mexico",19.43,-99.13,"cap","am"],["Guadalajara","Mexico",20.66,-103.35,"city","am"],["Monterrey","Mexico",25.69,-100.32,"city","am"],
["Cancún","Mexico",21.16,-86.85,"city","am"],["Tijuana","Mexico",32.51,-117.04,"city","am"],["Oaxaca","Mexico",17.07,-96.73,"city","am"],
["Guatemala City","Guatemala",14.63,-90.51,"cap","am"],["San Salvador","El Salvador",13.69,-89.22,"cap","am"],["Tegucigalpa","Honduras",14.07,-87.19,"cap","am"],
["Managua","Nicaragua",12.11,-86.24,"cap","am"],["San José","Costa Rica",9.93,-84.09,"cap","am"],["Panama City","Panama",8.98,-79.52,"cap","am"],
["Havana","Cuba",23.11,-82.37,"cap","am"],["Kingston","Jamaica",17.97,-76.79,"cap","am"],["Santo Domingo","Dominican Republic",18.49,-69.93,"cap","am"],
["Port-au-Prince","Haiti",18.54,-72.34,"cap","am"],["San Juan","Puerto Rico",18.47,-66.11,"city","am"],["Bogotá","Colombia",4.71,-74.07,"cap","am"],
["Medellín","Colombia",6.24,-75.58,"city","am"],["Caracas","Venezuela",10.48,-66.90,"cap","am"],["Quito","Ecuador",-0.18,-78.47,"cap","am"],
["Lima","Peru",-12.05,-77.04,"cap","am"],["Cusco","Peru",-13.53,-71.97,"city","am"],["La Paz","Bolivia",-16.50,-68.15,"city","am"],
["Santiago","Chile",-33.45,-70.67,"cap","am"],["Buenos Aires","Argentina",-34.60,-58.38,"cap","am"],["Montevideo","Uruguay",-34.90,-56.16,"cap","am"],
["Asunción","Paraguay",-25.26,-57.58,"cap","am"],["São Paulo","Brazil",-23.55,-46.63,"city","am"],["Rio de Janeiro","Brazil",-22.91,-43.17,"city","am"],
["Brasília","Brazil",-15.79,-47.88,"cap","am"],["Salvador","Brazil",-12.97,-38.50,"city","am"],["Manaus","Brazil",-3.12,-60.02,"city","am"],
["Recife","Brazil",-8.05,-34.88,"city","am"],["Georgetown","Guyana",6.80,-58.16,"cap","am"],["Paramaribo","Suriname",5.85,-55.20,"cap","am"],
["Ushuaia","Argentina",-54.80,-68.30,"city","am"],["Machu Picchu","Peru",-13.16,-72.55,"mark","am"],["Iguazu Falls","Argentina / Brazil",-25.69,-54.44,"nat","am"],
["Galápagos Islands","Ecuador",-0.74,-90.31,"nat","am"],["Chichén Itzá","Yucatán, Mexico",20.68,-88.57,"mark","am"],["Torres del Paine","Chile",-50.94,-73.41,"nat","am"],
["Salar de Uyuni","Bolivia",-20.13,-67.49,"nat","am"],["Angel Falls","Venezuela",5.97,-62.54,"nat","am"],["Banff","Alberta, Canada",51.18,-115.57,"nat","am"],
["Tikal","Guatemala",17.22,-89.62,"mark","am"],
// Oceania & remote (World map only)
["Sydney","Australia",-33.87,151.21,"city","oc"],["Melbourne","Australia",-37.81,144.96,"city","oc"],["Brisbane","Australia",-27.47,153.03,"city","oc"],
["Perth","Australia",-31.95,115.86,"city","oc"],["Adelaide","Australia",-34.93,138.60,"city","oc"],["Darwin","Australia",-12.46,130.84,"city","oc"],
["Canberra","Australia",-35.28,149.13,"cap","oc"],["Hobart","Tasmania, Australia",-42.88,147.33,"city","oc"],["Uluru","Australia",-25.34,131.04,"nat","oc"],
["Great Barrier Reef","Queensland, Australia",-16.92,145.77,"nat","oc"],["Auckland","New Zealand",-36.85,174.76,"city","oc"],["Wellington","New Zealand",-41.29,174.78,"cap","oc"],
["Queenstown","New Zealand",-45.03,168.66,"city","oc"],["Suva","Fiji",-18.14,178.44,"cap","oc"],["Port Moresby","Papua New Guinea",-9.44,147.18,"cap","oc"],
["Nuuk","Greenland",64.18,-51.69,"cap","wx"],["Easter Island","Chile",-27.11,-109.35,"mark","wx"],["Papeete","Tahiti, French Polynesia",-17.54,-149.57,"city","wx"],
];

/* ---------------- curated globe rounds ----------------
   [name, context, lat, lon, tier 1-5, story]
   Tier rises with each round: famous cities → capitals → wonders → history → the far corners. */
const CURATED = [
// Tier 1
["London","United Kingdom",51.51,-0.13,1,"The Romans founded Londinium around AD 47 at the first practical crossing point of the Thames."],
["Paris","France",48.86,2.35,1,"The Eiffel Tower was built for the 1889 World's Fair and was only supposed to stand for 20 years."],
["New York City","United States",40.71,-74.01,1,"Manhattan's street grid was laid out in the Commissioners' Plan of 1811, long before most of the island was built up."],
["Tokyo","Japan",35.68,139.69,1,"The city was called Edo until 1868, when the emperor moved in and renamed it Tokyo, the \"Eastern Capital.\""],
["Rome","Italy",41.90,12.50,1,"The Colosseum opened in AD 80 and could hold an estimated 50,000 spectators."],
["Sydney","Australia",-33.87,151.21,1,"The Opera House, designed by Danish architect Jørn Utzon, opened in 1973 after 14 years of construction."],
["Cairo","Egypt",30.04,31.24,1,"The Giza pyramids sit on the city's western edge. The Great Pyramid was the tallest human-made structure for about 3,800 years."],
["Rio de Janeiro","Brazil",-22.91,-43.17,1,"Christ the Redeemer has stood on Corcovado mountain above the city since 1931."],
["Moscow","Russia",55.76,37.62,1,"Most of the Kremlin's red-brick walls were built in the late 1400s by architects brought in from Italy."],
["Beijing","China",39.90,116.41,1,"The Forbidden City served as the imperial palace from 1420 until the last emperor, Puyi, was expelled in 1924."],
["Los Angeles","United States",34.05,-118.24,1,"It was founded in 1781 as El Pueblo de Nuestra Señora la Reina de los Ángeles."],
["Mumbai","India",19.08,72.88,1,"Mumbai began as seven separate islands, joined into one landmass by land reclamation in the 1700s and 1800s."],
["Istanbul","Türkiye",41.01,28.98,1,"It straddles the Bosphorus, making it one of the few major cities spread across two continents."],
["Mexico City","Mexico",19.43,-99.13,1,"The city is built on the ruins of Tenochtitlan, the Aztec capital that stood on an island in Lake Texcoco."],
["Toronto","Canada",43.65,-79.38,1,"The CN Tower was the world's tallest freestanding structure from 1976 until 2007."],
["Berlin","Germany",52.52,13.40,1,"The Berlin Wall split the city from 1961 until it fell on November 9, 1989."],
["Madrid","Spain",40.42,-3.70,1,"Philip II made Madrid the capital in 1561, partly because it sits near the geographic center of Spain."],
["Dubai","United Arab Emirates",25.20,55.27,1,"The Burj Khalifa, opened in 2010, is the tallest building in the world at 828 meters."],
["Singapore","Singapore",1.35,103.82,1,"Singapore became an independent country in 1965 after separating from Malaysia."],
["Buenos Aires","Argentina",-34.60,-58.38,1,"Avenida 9 de Julio, named for Argentina's independence day, is one of the widest avenues in the world."],
["Chicago","United States",41.88,-87.63,1,"After the Great Fire of 1871, Chicago rebuilt and gave the world its first skyscraper, the Home Insurance Building, in 1885."],
["Hong Kong","China",22.32,114.17,1,"Britain handed Hong Kong back to China on July 1, 1997, after more than 150 years of colonial rule."],
["Bangkok","Thailand",13.76,100.50,1,"Its full ceremonial name in Thai is one of the longest place names in the world."],
["Cape Town","South Africa",-33.92,18.42,1,"Table Mountain's flat top is often covered by a layer of cloud that locals call the \"tablecloth.\""],
["Athens","Greece",37.98,23.73,1,"The Parthenon on the Acropolis was completed in 438 BC and dedicated to the goddess Athena."],
// Tier 2
["Lisbon","Portugal",38.72,-9.14,2,"On All Saints' Day in 1755, an earthquake, tsunami and fires destroyed much of the city."],
["Seoul","South Korea",37.57,126.98,2,"The Han River splits the city, and the greater Seoul area holds about half of South Korea's population."],
["Nairobi","Kenya",-1.29,36.82,2,"Nairobi started in 1899 as a depot on the Uganda Railway. A national park with lions and giraffes sits inside city limits."],
["Lima","Peru",-12.05,-77.04,2,"Francisco Pizarro founded Lima in 1535 and called it the \"City of Kings.\""],
["Vancouver","Canada",49.28,-123.12,2,"Vancouver hosted the 2010 Winter Olympics, with ski events up the road in Whistler."],
["Stockholm","Sweden",59.33,18.07,2,"The city is built on 14 islands where Lake Mälaren meets the Baltic Sea."],
["Jakarta","Indonesia",-6.21,106.85,2,"Parts of Jakarta are sinking fast enough that Indonesia is building a new capital, Nusantara, on the island of Borneo."],
["Manila","Philippines",14.60,120.98,2,"Intramuros, the walled Spanish city at Manila's heart, dates to the late 1500s."],
["Havana","Cuba",23.11,-82.37,2,"Old Havana's colonial core has been a UNESCO World Heritage Site since 1982."],
["Bogotá","Colombia",4.71,-74.07,2,"At about 2,640 meters up in the Andes, it is one of the highest capital cities in the world."],
["Santiago","Chile",-33.45,-70.67,2,"The snowcapped Andes rise just east of the city and can be seen from downtown on clear days."],
["Tehran","Iran",35.69,51.39,2,"Mount Damavand, Iran's highest peak at 5,610 meters, rises northeast of the city."],
["Hanoi","Vietnam",21.03,105.85,2,"Hanoi celebrated its 1,000th birthday in 2010, marking the year Emperor Lý Thái Tổ moved his capital there."],
["Kyiv","Ukraine",50.45,30.52,2,"Saint Sophia Cathedral, with its golden domes and mosaics, dates from the 11th century."],
["Warsaw","Poland",52.23,21.01,2,"About 85% of Warsaw was destroyed in World War II. The Old Town was rebuilt using paintings and old records."],
["Dublin","Ireland",53.35,-6.26,2,"Vikings founded Dublin in the 9th century. The name comes from the Irish \"Dubh Linn,\" meaning black pool."],
["Casablanca","Morocco",33.57,-7.59,2,"The Hassan II Mosque's minaret rises about 210 meters, one of the tallest in the world."],
["Lagos","Nigeria",6.52,3.38,2,"Lagos was Nigeria's capital until 1991, when the government moved to the purpose-built city of Abuja."],
["Melbourne","Australia",-37.81,144.96,2,"Melbourne served as Australia's temporary capital from 1901 until Parliament moved to Canberra in 1927."],
["Seattle","United States",47.61,-122.33,2,"The Space Needle was built for the 1962 World's Fair."],
["Montreal","Canada",45.50,-73.57,2,"The city takes its name from Mount Royal, the hill at the center of the island."],
["Karachi","Pakistan",24.86,67.01,2,"Karachi was Pakistan's first capital, before Islamabad was built in the 1960s."],
["Riyadh","Saudi Arabia",24.71,46.68,2,"Ibn Saud's capture of the Masmak Fortress in 1902 marks the start of the modern Saudi state."],
["Oslo","Norway",59.91,10.75,2,"The Nobel Peace Prize is awarded in Oslo. The other Nobel prizes are handed out in Stockholm."],
["Prague","Czechia",50.08,14.44,2,"Its astronomical clock, installed in 1410, is the oldest one still working."],
["Vienna","Austria",48.21,16.37,2,"For centuries the city was home to the Habsburg court, and to composers from Mozart to Beethoven."],
["New Delhi","India",28.61,77.21,2,"Designed by Edwin Lutyens and Herbert Baker, New Delhi was inaugurated as the capital of British India in 1931."],
["Shanghai","China",31.23,121.47,2,"The colonial-era buildings of the Bund face the skyscrapers of Pudong across the Huangpu River."],
["Honolulu","Hawaii, United States",21.31,-157.86,2,"Pearl Harbor, attacked on December 7, 1941, lies just west of the city."],
["Reykjavík","Iceland",64.15,-21.94,2,"Reykjavík is the northernmost capital of a sovereign country."],
// Tier 3
["Machu Picchu","Peru",-13.16,-72.55,3,"The Inca built it in the mid-1400s. Hiram Bingham brought it to world attention in 1911."],
["Petra","Jordan",30.33,35.44,3,"The Nabataeans carved the Treasury straight into rose-red sandstone cliffs around the 1st century AD."],
["Angkor Wat","Cambodia",13.41,103.87,3,"Built in the early 1100s for King Suryavarman II, it is the largest religious monument in the world."],
["Taj Mahal","Agra, India",27.17,78.04,3,"Shah Jahan built it as a tomb for his wife Mumtaz Mahal. Work began in 1632."],
["Mount Everest","Nepal / China",27.99,86.93,3,"Edmund Hillary and Tenzing Norgay first reached the summit on May 29, 1953."],
["Chichén Itzá","Yucatán, Mexico",20.68,-88.57,3,"At the spring and autumn equinoxes, shadows form a serpent that seems to slide down El Castillo's staircase."],
["Kathmandu","Nepal",27.72,85.32,3,"The Kathmandu Valley holds seven separate monument zones on the UNESCO World Heritage list."],
["Addis Ababa","Ethiopia",9.03,38.74,3,"The African Union has its headquarters here."],
["Ulaanbaatar","Mongolia",47.89,106.91,3,"It is often called the coldest capital city in the world."],
["Marrakesh","Morocco",31.63,-8.01,3,"Every evening the Jemaa el-Fnaa square fills with food stalls, musicians and storytellers."],
["Kraków","Poland",50.06,19.94,3,"Kraków was Poland's royal capital until 1596. Wawel Castle still overlooks the Vistula River."],
["Edinburgh","Scotland",55.95,-3.19,3,"The castle stands on Castle Rock, the plug of an extinct volcano."],
["Anchorage","Alaska, United States",61.22,-149.90,3,"The 1964 Good Friday earthquake, magnitude 9.2, is the strongest ever recorded in North America."],
["Quito","Ecuador",-0.18,-78.47,3,"In 1978 Quito's old town was one of the first two cities named UNESCO World Heritage Sites."],
["Victoria Falls","Zambia / Zimbabwe",-17.92,25.86,3,"Locally it is Mosi-oa-Tunya, \"the smoke that thunders,\" where the Zambezi drops into a narrow gorge."],
["Kyoto","Japan",35.01,135.77,3,"Kyoto was Japan's imperial capital for over a thousand years, from 794 to 1868."],
["Dubrovnik","Croatia",42.65,18.09,3,"About 2 kilometers of medieval walls surround the old town."],
["Zanzibar","Tanzania",-6.16,39.19,3,"Stone Town was a hub of the Indian Ocean spice trade, and Freddie Mercury was born here."],
["Uluru","Australia",-25.34,131.04,3,"The sandstone monolith rises about 348 meters above the desert and is sacred to the Aṉangu people."],
["Mount Kilimanjaro","Tanzania",-3.07,37.36,3,"At 5,895 meters it is Africa's highest mountain and the tallest freestanding mountain in the world."],
["Iguazu Falls","Argentina / Brazil",-25.69,-54.44,3,"Roughly 275 separate waterfalls line the border between Argentina and Brazil."],
["Stonehenge","England",51.18,-1.83,3,"The big sarsen stones were raised around 2500 BC."],
["Venice","Italy",45.44,12.32,3,"Venice sits on more than 100 small islands in a lagoon, linked by over 400 bridges."],
["Santorini","Greece",36.39,25.46,3,"The island's crescent shape is the rim of a caldera left by a huge eruption around 1600 BC."],
["Salt Lake City","Utah, United States",40.76,-111.89,3,"The Great Salt Lake next door is several times saltier than the ocean."],
["New Orleans","Louisiana, United States",29.95,-90.07,3,"The French Quarter dates from the city's founding in 1718."],
["Jerusalem","Israel / Palestine",31.78,35.23,3,"The Old City covers less than one square kilometer but holds sites sacred to Judaism, Christianity and Islam."],
["Galápagos Islands","Ecuador",-0.74,-90.31,3,"Charles Darwin visited in 1835. The islands' finches later helped shape his theory of natural selection."],
["Samarkand","Uzbekistan",39.65,66.96,3,"A great Silk Road city, its Registan square is framed by three tiled madrasas."],
["Cusco","Peru",-13.53,-71.97,3,"The old Inca capital. Many Spanish colonial buildings stand on Inca stone foundations."],
// Tier 4
["Battle of Hastings","Battle, England",50.91,0.49,4,"William of Normandy defeated King Harold II here on October 14, 1066."],
["Waterloo","Belgium",50.68,4.41,4,"Napoleon met his final defeat here on June 18, 1815, against Wellington and Blücher."],
["Gettysburg","Pennsylvania, United States",39.83,-77.23,4,"The Civil War's bloodiest battle was fought here July 1–3, 1863. Lincoln gave his address here that November."],
["Omaha Beach","Normandy, France",49.37,-0.87,4,"One of the five Allied landing beaches on D-Day, June 6, 1944."],
["Pompeii","Italy",40.75,14.49,4,"Mount Vesuvius buried the town in ash in AD 79, preserving it for archaeologists."],
["Troy","Türkiye",39.96,26.24,4,"Heinrich Schliemann began digging at the Hisarlik mound, the likely site of Troy, in 1870."],
["Thermopylae","Greece",38.80,22.54,4,"Leonidas and his Spartans held this narrow pass against the Persian army in 480 BC."],
["Kitty Hawk","North Carolina, United States",36.02,-75.67,4,"The Wright brothers made the first powered airplane flight near here on December 17, 1903."],
["Yorktown","Virginia, United States",37.24,-76.51,4,"Cornwallis surrendered here in October 1781, effectively ending the Revolutionary War."],
["Lexington","Massachusetts, United States",42.45,-71.23,4,"The first shots of the American Revolution were fired here on April 19, 1775."],
["Stalingrad","Volgograd, Russia",48.71,44.51,4,"The Battle of Stalingrad in 1942–43 was a turning point of World War II in Europe."],
["Pripyat","Ukraine",51.40,30.05,4,"The town was abandoned after the Chernobyl nuclear disaster in April 1986."],
["Jamestown","Virginia, United States",37.21,-76.78,4,"Founded in 1607, it was the first permanent English settlement in the Americas."],
["Plymouth Rock","Massachusetts, United States",41.96,-70.66,4,"The Mayflower Pilgrims came ashore here in December 1620."],
["Wittenberg","Germany",51.87,12.65,4,"Martin Luther's Ninety-five Theses, written here in 1517, launched the Reformation."],
["Gallipoli","Türkiye",40.24,26.28,4,"Site of the 1915–16 campaign that Australians and New Zealanders remember each year on Anzac Day."],
["Điện Biên Phủ","Vietnam",21.39,103.02,4,"The Viet Minh victory here in 1954 ended French rule in Indochina."],
["Little Bighorn","Montana, United States",45.57,-107.43,4,"Lakota, Cheyenne and Arapaho warriors defeated Custer's 7th Cavalry here in 1876."],
["Agincourt","France",50.46,2.14,4,"Henry V's outnumbered English army won a famous victory here in 1415."],
["Carthage","Tunisia",36.85,10.32,4,"The Phoenician city rivaled Rome for centuries until Rome destroyed it in 146 BC."],
["Babylon","Iraq",32.54,44.42,4,"Hammurabi ruled from here, and Nebuchadnezzar II built the blue-tiled Ishtar Gate around 575 BC."],
["Timbuktu","Mali",16.77,-3.01,4,"In the 1400s and 1500s it was a center of Islamic scholarship, with thousands of manuscripts."],
["Hiroshima","Japan",34.39,132.46,4,"The first atomic bomb used in war struck the city on August 6, 1945."],
["The Alamo","San Antonio, Texas",29.43,-98.49,4,"The 1836 siege of this mission became the rallying cry \"Remember the Alamo!\" in Texas's war for independence."],
["Appomattox","Virginia, United States",37.38,-78.80,4,"Lee surrendered to Grant here on April 9, 1865."],
["Runnymede","England",51.44,-0.56,4,"King John sealed Magna Carta in this meadow beside the Thames in 1215."],
["Olympia","Greece",37.64,21.63,4,"The ancient Olympic Games were held here, first recorded in 776 BC."],
["Delphi","Greece",38.48,22.50,4,"Ancient Greeks traveled here to consult the oracle of Apollo."],
["Bletchley Park","England",52.00,-0.74,4,"Codebreakers here, including Alan Turing, cracked German Enigma messages during World War II."],
["Cape Canaveral","Florida, United States",28.57,-80.65,4,"Apollo 11 launched from here on July 16, 1969, on its way to the first Moon landing."],
["Roanoke Island","North Carolina, United States",35.91,-75.67,4,"The \"Lost Colony\" of 1587 vanished here, leaving behind only the word CROATOAN carved on a post."],
["Great Zimbabwe","Zimbabwe",-20.27,30.93,4,"This stone city was the capital of a kingdom from roughly the 1000s to the 1400s, and gave the country its name."],
["Lalibela","Ethiopia",12.03,39.04,4,"Eleven churches here were carved down into solid rock in the 1100s and 1200s."],
["Mohenjo-daro","Pakistan",27.33,68.14,4,"One of the largest cities of the Indus Valley civilization, built around 2500 BC."],
["Terracotta Army","Xi'an, China",34.38,109.27,4,"Over 8,000 clay soldiers guard the tomb of China's first emperor. Farmers digging a well found them in 1974."],
// Tier 5
["Pitcairn Island","British Overseas Territory",-25.07,-130.10,5,"HMS Bounty mutineers and Tahitians settled here in 1790. About 50 people live here today."],
["Easter Island","Chile",-27.11,-109.35,5,"Nearly 1,000 moai statues stand on the island. The nearest inhabited land is Pitcairn, about 2,000 km away."],
["Tristan da Cunha","British Overseas Territory",-37.07,-12.31,5,"The most remote inhabited archipelago in the world, about 2,400 km from Saint Helena."],
["Longyearbyen","Svalbard, Norway",78.22,15.65,5,"The world's northernmost town of more than 1,000 people. The Svalbard Global Seed Vault is just outside town."],
["Ushuaia","Argentina",-54.80,-68.30,5,"It calls itself the southernmost city in the world and is the main port for cruises to Antarctica."],
["Nuuk","Greenland",64.18,-51.69,5,"Greenland's capital is home to about a third of the island's population."],
["Funafuti","Tuvalu",-8.52,179.20,5,"Tuvalu's highest point is less than 5 meters above sea level."],
["Socotra","Yemen",12.46,53.82,5,"The island is known for umbrella-shaped dragon's blood trees that grow nowhere else."],
["Palmyra","Syria",34.55,38.27,5,"This desert oasis was a key Silk Road stop, and its Roman-era ruins made it famous."],
["Lhasa","Tibet, China",29.65,91.12,5,"The Potala Palace, winter home of the Dalai Lamas, sits about 3,650 meters above sea level."],
["Leh","Ladakh, India",34.16,77.58,5,"Ladakh's main town sits above 3,500 meters in the Himalaya."],
["Oymyakon","Siberia, Russia",63.46,142.79,5,"One of the coldest inhabited places on Earth, where temperatures have dropped to about −68 °C."],
["Norilsk","Siberia, Russia",69.35,88.20,5,"One of the northernmost cities in the world, built around huge nickel mines."],
["Utqiagvik","Alaska, United States",71.29,-156.79,5,"Formerly called Barrow, it is the northernmost town in the US. In summer the sun doesn't set for about 80 days."],
["Stanley","Falkland Islands",-51.69,-57.86,5,"The small capital of the Falkland Islands, in the South Atlantic."],
["Saint Helena","British Overseas Territory",-15.92,-5.72,5,"Napoleon was exiled to this island in 1815 and died here in 1821."],
["Tórshavn","Faroe Islands",62.01,-6.77,5,"The Faroese parliament traces its roots back to the Viking age."],
["Moynaq","Uzbekistan",43.77,59.02,5,"Once a fishing port on the Aral Sea, it now sits far inland as the sea has shrunk."],
["Mount Ararat","Türkiye",39.70,44.30,5,"Turkey's highest peak, at 5,137 meters, is traditionally linked to Noah's Ark."],
["Nazca Lines","Peru",-14.74,-75.13,5,"Giant figures etched into the desert between about 500 BC and AD 500, best seen from the air."],
["Thimphu","Bhutan",27.47,89.64,5,"Bhutan's capital is known for having no traffic lights."],
["Tarawa","Kiribati",1.33,172.98,5,"Kiribati's capital. The 1943 Battle of Tarawa was one of the bloodiest of the Pacific War."],
["Chinguetti","Mauritania",20.46,-12.36,5,"This old Saharan trading town is famous for its desert libraries of medieval manuscripts."],
["Djenné","Mali",13.91,-4.55,5,"Its Great Mosque is the largest mud-brick building in the world."],
["Kiruna","Sweden",67.86,20.23,5,"The iron mine under Kiruna is undermining the town, so it is being moved about 3 km east."],
["Petropavlovsk-Kamchatsky","Russia",53.02,158.65,5,"No road connects it to the rest of Russia, and volcanoes surround the city."],
["Alert","Nunavut, Canada",82.50,-62.35,5,"This Canadian station is the northernmost permanently inhabited place in the world."],
["Churchill","Manitoba, Canada",58.77,-94.16,5,"Known as the polar bear capital of the world, on the shore of Hudson Bay."],
["Coober Pedy","South Australia",-29.01,134.75,5,"In this opal-mining town, many residents live underground to escape the heat."],
["Iqaluit","Nunavut, Canada",63.75,-68.52,5,"Nunavut's capital was known as Frobisher Bay until 1987."],
];

/* ---------------- population & terrain data ----------------
   CITIES: "lat,lon,population in thousands" separated by ";"
   RURAL:  dense countryside haze — [lat, lon, radius km, weight]
   RANGES: mountain ranges — [width in degrees, height 0-1, [[lon,lat], ...]] */
const CITIES = (
// USA
"40.71,-74.01,19500;34.05,-118.24,13000;41.88,-87.63,9400;32.78,-96.80,6600;32.75,-97.33,1500;29.76,-95.37,7100;38.90,-77.04,6300;25.76,-80.19,3500;26.12,-80.14,1900;26.71,-80.05,1500;"+
"39.95,-75.17,6200;33.75,-84.39,6100;33.45,-112.07,4900;42.36,-71.06,4900;37.77,-122.42,2500;37.80,-122.27,1500;37.34,-121.89,2000;34.10,-117.30,4600;33.72,-117.85,2500;42.33,-83.05,4300;"+
"47.61,-122.33,3200;47.25,-122.44,900;44.98,-93.27,3700;32.72,-117.16,3300;27.95,-82.46,2400;27.77,-82.64,800;39.74,-104.99,3000;38.63,-90.20,2800;39.29,-76.61,2800;35.23,-80.84,2700;"+
"28.54,-81.38,2700;29.42,-98.49,2600;45.52,-122.68,2500;38.58,-121.49,2400;40.44,-79.99,2400;30.27,-97.74,2400;36.17,-115.14,2300;39.10,-94.58,2200;39.10,-84.51,2200;39.96,-83.00,2100;"+
"41.50,-81.69,2100;39.77,-86.16,2100;36.16,-86.78,2000;37.54,-77.44,1300;36.85,-76.29,1800;41.82,-71.41,1600;43.04,-87.91,1600;30.33,-81.66,1600;35.15,-90.05,1300;35.47,-97.52,1400;"+
"38.25,-85.76,1300;35.78,-78.64,1400;35.99,-78.90,600;29.95,-90.07,1300;40.76,-111.89,1300;40.23,-111.66,650;41.22,-111.97,700;41.76,-72.69,1200;42.89,-78.88,1100;33.52,-86.80,1100;"+
"43.16,-77.61,1100;42.96,-85.67,1100;32.22,-110.97,1000;21.31,-157.86,1000;36.15,-95.99,1000;36.75,-119.77,1000;41.26,-95.93,970;35.08,-106.65,920;42.65,-73.75,900;41.31,-72.92,860;"+
"41.18,-73.19,950;35.96,-83.92,900;31.76,-106.49,870;35.37,-119.02,900;40.60,-75.47,860;32.78,-79.93,800;34.85,-82.40,950;43.62,-116.20,780;43.07,-89.40,680;32.08,-81.09,400;"+
"27.34,-82.53,850;26.64,-81.87,780;34.00,-81.03,840;34.75,-92.29,750;41.59,-93.62,720;43.05,-76.15,650;30.45,-91.19,870;37.69,-97.34,650;38.83,-104.82,760;32.30,-90.18,580;"+
"30.69,-88.04,430;30.44,-84.28,390;32.36,-86.30,380;33.58,-101.86,330;35.22,-101.83,270;31.55,-97.15,280;27.80,-97.40,440;26.20,-98.23,880;47.66,-117.43,590;39.53,-119.81,500;"+
"44.05,-123.09,380;45.78,-108.50,190;46.87,-113.99,120;41.14,-104.82,100;46.88,-96.79,250;43.54,-96.73,280;44.08,-103.23,150;40.81,-96.70,340;37.21,-93.29,480;38.95,-92.33,210;"+
"42.50,-96.40,150;43.01,-83.69,400;42.73,-84.55,540;41.65,-83.54,640;41.08,-81.52,700;39.76,-84.19,810;41.08,-85.14,420;41.68,-86.25,320;44.51,-88.02,330;44.48,-73.21,220;"+
"43.66,-70.26,550;44.80,-68.77,150;42.10,-72.59,700;42.26,-71.80,950;43.00,-71.45,420;39.74,-75.55,700;40.22,-74.76,380;40.27,-76.88,580;40.04,-76.31,550;41.41,-75.66,570;"+
"38.03,-78.48,220;37.27,-79.94,310;38.35,-81.63,250;36.07,-79.79,780;36.10,-80.24,680;35.60,-82.55,470;34.23,-77.94,300;35.05,-85.31,570;33.47,-82.01,610;32.46,-84.99,330;"+
"32.84,-83.63,230;30.42,-87.22,500;29.65,-82.32,340;28.08,-80.61,600;24.56,-81.78,30;30.22,-92.02,480;32.52,-93.75,390;30.63,-96.33,270;34.42,-119.70,450;34.20,-119.18,850;"+
"36.60,-121.89,430;37.64,-120.99,550;37.96,-121.29,780;40.59,-122.39,180;42.33,-122.87,220;44.94,-123.04,430;46.60,-120.51,250;46.28,-119.28,300;48.75,-122.48,230;33.83,-116.55,450;"+
"32.69,-114.63,210;35.20,-111.65,145;37.10,-113.58,190;39.06,-108.55,155;40.59,-105.08,360;40.02,-105.27,330;38.25,-104.61,170;32.35,-106.76,220;35.69,-105.94,150;31.99,-102.08,300;"+
"32.45,-99.73,170;33.91,-98.49,150;39.05,-95.68,230;46.81,-100.78,130;47.93,-97.03,100;46.79,-92.10,280;44.02,-92.47,220;61.22,-149.90,400;64.84,-147.72,100;19.72,-155.08,50;20.89,-156.47,100;"+
// Canada
"43.65,-79.38,6400;43.26,-79.87,780;45.50,-73.57,4300;49.28,-123.12,2700;51.05,-114.07,1600;53.55,-113.49,1500;45.42,-75.70,1500;49.90,-97.14,850;46.81,-71.21,840;43.45,-80.49,600;"+
"42.98,-81.25,550;44.65,-63.57,470;48.43,-123.37,400;52.13,-106.67,330;50.45,-104.61,260;42.32,-83.04,420;43.18,-79.24,430;44.23,-76.49,170;47.56,-52.71,210;45.27,-66.06,130;"+
"46.09,-64.78,160;46.49,-80.99,170;48.38,-89.25,120;49.89,-119.50,220;62.45,-114.37,20;60.72,-135.06,30;45.40,-71.89,220;46.35,-72.55,150;48.43,-71.06,160;63.75,-68.52,8;"+
// Mexico, Central America, Caribbean
"19.43,-99.13,21800;20.66,-103.35,5300;25.69,-100.32,5300;19.04,-98.21,3200;32.51,-117.04,2200;21.12,-101.68,1900;19.29,-99.66,2400;31.69,-106.42,1500;20.59,-100.39,1500;25.54,-103.41,1400;"+
"22.15,-100.98,1200;20.97,-89.62,1300;16.85,-99.88,1000;28.63,-106.07,1000;21.16,-86.85,900;29.07,-110.95,950;24.81,-107.39,1000;32.62,-115.45,1100;23.25,-106.41,500;19.18,-96.13,900;"+
"17.99,-92.93,850;16.75,-93.12,700;17.07,-96.73,700;18.92,-99.23,1000;21.88,-102.29,1100;22.77,-102.58,350;24.02,-104.67,650;22.25,-97.86,900;26.09,-98.28,700;25.87,-97.50,400;"+
"27.48,-99.51,400;24.14,-110.31,300;19.70,-101.19,900;20.62,-105.23,500;14.63,-90.51,3000;13.69,-89.22,1800;14.07,-87.19,1300;15.50,-88.03,1000;12.11,-86.24,1100;9.93,-84.09,1400;"+
"8.98,-79.52,1900;23.11,-82.37,2100;20.02,-75.82,500;21.38,-77.92,330;18.49,-69.93,3500;19.45,-70.69,800;18.54,-72.34,2800;19.76,-72.20,300;17.97,-76.79,1200;18.47,-66.11,2000;"+
"10.65,-61.51,550;13.10,-59.61,280;"+
// South America
"-23.55,-46.63,22400;-22.91,-43.17,13600;-34.60,-58.38,15500;-12.05,-77.04,11000;4.71,-74.07,11500;-33.45,-70.67,6900;-19.92,-43.94,6000;-15.79,-47.88,4800;-12.97,-38.50,4000;-3.73,-38.53,4100;"+
"-8.05,-34.88,4100;-30.03,-51.23,4300;-25.43,-49.27,3700;-16.69,-49.25,2600;-1.46,-48.50,2300;-3.12,-60.02,2300;-22.91,-47.06,3300;-23.96,-46.33,1900;-20.32,-40.34,2000;-2.53,-44.30,1500;"+
"-5.79,-35.21,1500;-7.12,-34.86,1200;-9.67,-35.74,1200;-10.91,-37.07,950;-5.09,-42.80,900;-27.60,-48.55,1200;-26.30,-48.85,600;-21.18,-47.81,1100;-23.18,-45.88,800;-18.92,-48.28,700;"+
"-23.31,-51.16,600;-15.60,-56.10,900;-20.44,-54.65,900;-8.76,-63.90,500;-9.97,-67.81,400;-10.18,-48.33,300;2.82,-60.67,400;0.03,-51.07,500;-2.44,-54.71,300;-31.77,-52.34,350;"+
"-34.90,-56.16,1800;-25.26,-57.58,2300;-31.42,-64.18,1600;-32.95,-60.65,1400;-32.89,-68.84,1200;-26.81,-65.22,900;-24.78,-65.41,650;-34.92,-57.95,900;-38.00,-57.56,650;-31.63,-60.70,550;"+
"-27.47,-58.83,400;-38.95,-68.06,400;-41.13,-71.31,130;-45.86,-67.48,200;-54.80,-68.30,80;-51.62,-69.22,100;-33.05,-71.62,1000;-36.83,-73.05,1000;-23.65,-70.40,400;-29.90,-71.25,500;"+
"-18.48,-70.31,220;-20.21,-70.15,200;-39.81,-73.25,170;-38.74,-72.60,300;-41.47,-72.94,250;-53.16,-70.91,130;-16.50,-68.15,1900;-17.78,-63.18,1800;-17.39,-66.16,1300;-19.04,-65.26,300;"+
"-19.59,-65.75,250;-0.18,-78.47,2000;-2.19,-79.89,3000;-2.90,-79.00,450;6.24,-75.58,4000;3.45,-76.53,2800;10.97,-74.80,2200;10.39,-75.51,1100;7.12,-73.12,1200;7.89,-72.50,900;"+
"4.81,-75.69,700;2.44,-76.61,300;10.48,-66.90,3000;10.65,-71.64,2200;10.16,-68.00,1600;10.07,-69.32,1200;8.12,-63.55,400;8.35,-62.64,900;10.13,-64.68,700;6.80,-58.16,300;"+
"5.85,-55.20,250;4.94,-52.33,150;-8.11,-79.03,1000;-6.77,-79.84,600;-16.40,-71.54,1100;-13.53,-71.97,450;-5.19,-80.63,500;-3.75,-73.25,450;-12.07,-75.20,400;-15.84,-70.02,150;"+
// Europe
"51.51,-0.13,14000;48.86,2.35,11000;40.42,-3.70,6700;41.39,2.17,5600;52.52,13.40,4500;45.46,9.19,4300;41.90,12.50,4300;55.76,37.62,17000;59.93,30.34,5400;41.01,28.98,15600;"+
"51.45,7.01,5500;51.23,6.78,1500;50.94,6.96,2000;53.55,9.99,2500;48.14,11.58,2900;50.11,8.68,2600;48.78,9.18,2700;49.45,11.08,1300;51.34,12.37,1000;51.05,13.74,1000;"+
"52.37,9.73,1100;53.08,8.80,1000;49.49,8.47,1500;52.02,8.53,500;51.96,7.63,500;48.37,10.90,450;54.32,10.13,300;54.09,12.13,250;52.37,4.90,2500;51.92,4.48,2000;"+
"52.08,4.30,1000;52.09,5.12,650;51.44,5.47,750;53.22,6.57,350;50.85,4.35,2100;51.22,4.40,1100;51.05,3.72,600;50.63,5.57,750;50.63,3.06,1200;49.61,6.13,600;"+
"45.76,4.84,2300;43.30,5.37,1900;43.60,1.44,1400;44.84,-0.58,1300;47.22,-1.55,1000;43.70,7.27,1000;48.58,7.75,800;48.11,-1.68,750;49.44,1.10,700;43.61,3.88,800;"+
"45.19,5.72,700;47.47,-0.55,430;47.39,0.69,500;49.26,4.03,300;48.69,6.18,450;47.32,5.04,380;45.78,3.09,480;49.18,-0.37,420;48.39,-4.49,300;43.48,-1.56,300;"+
"43.12,5.93,600;42.70,2.90,300;47.90,1.91,420;45.83,1.26,280;49.12,6.18,390;46.95,7.45,420;47.38,8.54,1400;46.20,6.15,600;47.56,7.59,550;46.52,6.63,420;"+
"48.21,16.37,2900;47.07,15.44,650;48.31,14.29,500;47.80,13.04,350;47.27,11.39,300;50.08,14.44,2700;49.20,16.61,700;49.82,18.26,1000;52.23,21.01,3100;50.06,19.94,1500;"+
"50.26,19.02,2700;51.76,19.46,1000;51.11,17.03,1200;52.41,16.93,1000;54.35,18.65,1200;53.43,14.55,700;51.25,22.57,650;53.12,18.01,650;53.13,23.16,450;50.04,22.00,450;"+
"47.50,19.04,3000;47.53,21.63,330;46.25,20.15,300;48.15,17.11,650;48.72,21.26,350;46.06,14.51,550;45.81,15.98,1100;43.51,16.44,350;44.79,20.45,1700;45.27,19.83,400;"+
"43.32,21.90,260;43.86,18.41,550;42.44,19.26,200;41.33,19.82,900;41.99,21.43,600;42.66,21.17,500;42.70,23.32,1700;42.14,24.75,550;43.21,27.91,450;44.43,26.10,2300;"+
"46.77,23.59,700;47.16,27.59,500;45.75,21.23,450;44.18,28.65,450;45.65,25.61,400;47.01,28.86,800;50.45,30.52,3500;49.99,36.23,1800;46.48,30.72,1100;48.46,35.05,1200;"+
"49.84,24.03,900;47.84,35.14,900;48.02,37.80,1500;53.90,27.57,2000;53.68,23.83,370;52.43,31.00,500;54.69,25.28,750;54.90,23.89,400;56.95,24.11,900;59.44,24.75,600;"+
"60.17,24.94,1500;61.50,23.76,400;60.45,22.27,330;65.01,25.47,250;59.33,18.07,2400;57.71,11.97,1100;55.60,13.00,750;59.86,17.64,250;63.83,20.26,150;59.91,10.75,1600;"+
"60.39,5.32,420;58.97,5.73,350;63.43,10.40,280;69.65,18.96,80;55.68,12.57,2100;56.16,10.20,350;55.40,10.39,200;57.05,9.92,200;64.15,-21.94,240;53.35,-6.26,2000;"+
"51.90,-8.47,400;53.27,-9.05,120;52.66,-8.63,160;54.60,-5.93,650;55.86,-4.25,1800;55.95,-3.19,900;57.15,-2.09,300;56.46,-2.97,250;57.48,-4.22,70;53.48,-2.24,2900;"+
"52.49,-1.89,2900;53.80,-1.55,1900;53.41,-2.98,1400;54.97,-1.61,1100;53.38,-1.47,900;51.45,-2.59,900;52.95,-1.15,800;50.90,-1.40,900;51.48,-3.18,1100;52.63,-1.13,550;"+
"50.82,-0.14,500;50.38,-4.14,260;52.63,1.30,280;52.21,0.12,280;51.75,-1.26,250;53.74,-0.33,300;51.62,-3.94,300;54.57,-1.23,380;50.72,-3.53,200;38.72,-9.14,2900;"+
"41.15,-8.61,1700;37.02,-7.93,250;40.21,-8.43,200;37.39,-5.98,1500;39.47,-0.38,1800;36.72,-4.42,1100;43.26,-2.93,1000;41.65,-0.89,750;37.98,-1.13,700;38.35,-0.48,750;"+
"39.57,2.65,500;43.36,-5.85,800;42.24,-8.72,500;43.37,-8.40,400;41.65,-4.72,400;37.18,-3.60,550;37.88,-4.78,330;36.53,-6.29,600;43.32,-1.98,450;42.82,-1.64,350;"+
"40.97,-5.66,200;28.12,-15.43,650;28.47,-16.25,550;40.85,14.27,3100;45.07,7.69,1700;44.41,8.93,600;44.49,11.34,1000;43.77,11.26,1000;45.44,12.32,850;45.41,11.88,400;"+
"45.44,10.99,700;38.12,13.36,850;37.50,15.09,750;41.12,16.87,750;39.22,9.12,450;45.65,13.78,230;45.70,9.67,500;45.54,10.22,650;43.72,10.40,200;43.60,13.51,200;"+
"42.46,14.21,350;38.19,15.55,250;40.47,17.24,200;46.07,11.12,200;46.50,11.35,100;43.11,12.39,170;37.98,23.73,3600;40.64,22.94,1000;38.25,21.73,250;35.34,25.13,200;"+
"39.64,22.42,170;35.90,14.51,450;35.17,33.36,400;56.33,44.00,1300;55.79,49.12,1300;53.20,50.15,1200;47.24,39.71,1300;48.71,44.51,1000;51.66,39.20,1000;54.73,55.96,1100;"+
"58.01,56.23,1000;56.84,60.61,1500;55.16,61.40,1200;45.04,38.98,1000;51.53,46.03,850;54.31,48.40,600;54.19,37.62,500;54.63,39.74,500;57.63,39.87,600;56.13,40.40,350;"+
"54.71,20.51,500;68.97,33.08,280;64.54,40.54,350;61.79,34.35,280;58.52,31.27,220;57.82,28.33,200;54.78,32.05,320;53.24,34.36,400;51.73,36.19,450;50.60,36.59,400;"+
"52.60,39.60,500;53.19,45.02,520;51.77,55.10,560;58.60,49.66,500;61.67,50.84,250;43.58,39.72,450;43.02,44.68,300;42.98,47.50,600;46.35,48.04,500;44.95,34.10,350;44.62,33.52,450;"+
// East Asia
"35.68,139.69,37000;34.69,135.50,17000;35.01,135.77,1500;35.18,136.91,9500;33.59,130.40,5500;43.06,141.35,2600;38.27,140.87,2200;34.39,132.46,2000;34.66,133.92,1500;32.80,130.71,1400;"+
"31.60,130.56,1000;33.84,132.77,600;34.97,138.38,1000;34.71,137.73,1100;37.92,139.04,1000;36.56,136.66,700;36.39,139.06,600;36.56,139.88,1000;40.82,140.74,300;39.70,141.15,450;"+
"26.21,127.68,1300;33.95,130.94,1000;34.34,134.05,500;35.47,133.05,200;32.75,129.88,400;41.77,140.73,250;43.77,142.36,330;36.65,138.18,380;34.23,135.17,360;37.40,140.38,300;38.24,140.36,250;"+
"37.57,126.98,25000;35.18,129.08,3400;35.87,128.60,2400;35.16,126.85,1500;36.35,127.38,1500;35.54,129.31,1100;36.64,127.49,850;33.50,126.53,500;35.82,127.15,650;37.75,128.90,210;"+
"36.02,129.36,500;39.04,125.76,3000;39.92,127.54,700;41.80,129.78,650;40.10,124.40,350;"+
"39.90,116.41,21000;31.23,121.47,28000;23.13,113.26,19000;22.54,114.06,17500;22.32,114.17,7500;29.56,106.55,9000;39.08,117.20,14000;30.57,104.07,9500;30.59,114.31,8800;34.34,108.94,8000;"+
"32.06,118.80,9000;30.27,120.16,9500;36.07,120.38,6000;38.04,114.51,4500;41.80,123.43,7000;38.91,121.60,4500;45.80,126.53,6000;43.82,125.32,4500;36.65,117.12,6000;34.75,113.63,7000;"+
"28.23,112.94,5500;28.68,115.86,4000;26.07,119.30,4500;24.48,118.09,4500;31.82,117.23,5000;31.30,120.59,6500;31.49,120.31,3500;31.78,119.95,2500;29.87,121.54,4000;28.00,120.67,3500;"+
"23.02,113.75,8000;23.02,113.12,8000;22.27,113.58,2500;22.82,108.37,4500;25.04,102.71,5000;26.65,106.63,4500;25.27,110.29,1500;20.04,110.34,2300;18.25,109.51,700;37.87,112.55,4000;"+
"40.84,111.75,2500;40.66,109.84,2000;36.06,103.83,3500;36.62,101.78,1800;38.49,106.23,2000;43.83,87.62,4000;39.47,75.99,800;29.65,91.12,600;34.26,117.18,3500;34.62,112.45,2500;"+
"37.46,121.45,2500;36.81,118.05,2500;39.63,118.18,2500;38.87,115.46,2000;40.77,114.88,900;40.08,113.30,1800;46.59,125.10,1500;47.35,123.92,1000;44.58,129.60,900;46.80,130.32,800;"+
"49.21,119.74,300;29.35,104.77,1000;31.46,104.68,1500;30.82,106.08,1500;25.84,114.93,1500;24.33,109.41,2000;21.48,109.12,700;29.03,111.70,800;27.83,113.13,1200;30.70,111.29,1500;"+
"32.01,112.12,1500;32.39,119.41,2000;32.02,120.86,2000;33.61,119.02,1500;34.60,119.22,1500;31.33,118.43,1500;30.51,117.05,700;32.94,117.39,1000;35.41,116.59,1500;35.10,118.36,2000;"+
"37.51,122.12,700;36.71,119.16,1500;21.27,110.36,1500;23.36,116.68,4000;24.51,117.65,1000;24.87,118.68,2000;30.00,120.58,2000;30.75,120.76,1500;29.08,119.65,1200;28.66,121.42,1500;"+
"41.12,122.99,1500;41.85,123.90,1200;40.12,124.39,800;41.10,121.13,800;43.88,126.55,1500;42.89,129.51,500;34.36,107.24,1000;35.29,113.93,1000;32.13,114.07,800;36.10,114.39,1000;36.60,114.49,1500;"+
"25.03,121.57,7000;22.63,120.30,2700;24.15,120.67,2800;23.00,120.21,1800;24.80,120.97,700;23.97,121.60,300;47.89,106.91,1600;"+
// Southeast Asia
"14.60,120.98,24000;10.32,123.89,3000;7.07,125.61,2000;8.48,124.65,800;10.72,122.56,500;16.41,120.60,350;11.24,125.00,250;6.91,122.08,900;21.03,105.85,8500;10.82,106.63,9500;"+
"20.86,106.68,2000;16.05,108.22,1200;10.05,105.75,1300;16.46,107.59,500;12.24,109.19,500;18.68,105.68,500;11.94,108.44,400;13.78,109.22,300;13.76,100.50,11000;18.79,98.99,1200;"+
"7.01,100.47,900;14.97,102.10,500;16.43,102.83,500;17.41,102.79,400;7.88,98.39,400;12.93,100.88,1000;11.56,104.92,2300;13.36,103.86,250;13.10,103.20,250;17.97,102.63,900;"+
"19.89,102.14,100;16.84,96.17,5500;21.96,96.08,1500;19.76,96.08,1200;16.49,97.63,500;3.14,101.69,8500;5.41,100.33,2500;1.49,103.74,1800;4.60,101.08,800;1.55,110.35,700;"+
"5.98,116.07,600;2.19,102.25,500;6.12,102.24,500;3.81,103.33,500;1.35,103.82,6000;4.89,114.94,250;-6.21,106.85,34000;-6.92,107.61,8000;-7.25,112.75,10000;-6.97,110.42,4000;"+
"3.59,98.67,4500;-2.98,104.76,2000;-5.15,119.43,2000;-7.80,110.36,4000;-7.57,110.82,3500;-8.65,115.22,2000;-7.98,112.63,3500;-0.95,100.35,1100;-0.03,109.33,800;-1.24,116.85,800;"+
"-0.50,117.15,900;-3.32,114.59,900;1.47,124.84,800;-5.43,105.26,1500;0.51,101.45,1300;-6.73,108.55,2000;-6.60,106.80,6000;-8.58,116.12,800;-10.17,123.61,450;-3.70,128.18,400;"+
"-2.53,140.72,300;1.13,104.05,1200;-7.36,108.22,1000;-7.43,109.24,1500;-6.87,109.13,1500;-8.17,113.70,2500;-7.87,111.46,800;-1.61,103.61,700;-3.80,102.26,400;5.55,95.32,500;"+
"-0.89,119.87,400;-3.99,122.51,400;-8.56,125.57,280;-9.44,147.18,400;-6.73,147.00,100;"+
// South Asia
"28.61,77.21,33000;19.08,72.88,22000;22.57,88.36,15500;12.97,77.59,13500;13.08,80.27,11500;17.39,78.49,10500;23.02,72.57,8500;18.52,73.86,7000;21.17,72.83,7500;26.85,80.95,4000;"+
"26.45,80.33,3200;26.91,75.79,4000;21.15,79.09,3000;22.72,75.86,3300;23.26,77.41,2500;25.59,85.14,2500;30.73,76.78,1300;31.63,74.87,1300;30.90,75.85,2000;27.18,78.01,2000;"+
"25.32,82.97,1700;25.44,81.85,1500;28.98,77.71,1600;28.37,79.43,1100;27.88,78.08,1000;26.22,78.18,1200;23.18,79.99,1400;22.31,73.18,2200;22.30,70.80,2000;19.99,73.79,2000;"+
"19.88,75.34,1300;17.69,83.22,2100;16.51,80.65,1800;20.30,85.82,1100;21.25,81.63,1300;23.34,85.31,1300;22.80,86.18,1400;23.80,86.43,1200;26.14,91.74,1100;11.02,76.96,2500;"+
"9.93,78.12,1600;10.79,78.70,1100;11.66,78.15,1000;9.93,76.27,2500;8.52,76.94,1700;11.26,75.78,2000;10.53,76.21,2000;8.89,76.61,1200;12.91,74.86,700;12.30,76.64,1100;"+
"15.36,75.12,1000;15.85,74.50,600;16.70,74.24,600;17.66,75.91,1000;15.49,73.83,500;26.24,73.02,1300;24.58,73.71,600;28.02,73.31,700;25.18,75.83,1200;32.73,74.86,700;"+
"34.08,74.80,1500;30.32,78.03,800;31.10,77.17,200;26.76,83.37,700;24.80,84.99,500;25.24,86.97,500;22.26,84.85,500;24.82,93.94,500;25.57,91.88,350;23.83,91.29,600;"+
"27.48,94.91,200;13.63,79.42,500;14.44,79.99,600;16.30,80.44,700;18.00,79.58,800;14.68,77.60,400;15.83,78.04,500;12.92,79.13,500;11.94,79.83,400;8.73,77.70,500;"+
"19.31,84.79,400;20.46,85.88,700;27.34,88.61,100;26.71,88.43,700;27.72,85.32,3000;28.21,83.99,500;26.45,87.28,300;23.81,90.41,23000;22.36,91.78,5500;22.85,89.54,1000;"+
"24.90,91.87,700;24.37,88.60,900;22.70,90.35,400;24.75,90.40,500;25.74,89.25,400;23.46,91.18,500;6.93,79.86,2500;7.29,80.63,300;9.66,80.01,200;24.86,67.01,17000;"+
"31.55,74.34,13500;31.42,73.08,3500;33.60,73.05,2500;33.68,73.05,1200;30.20,71.47,2000;25.40,68.36,1800;34.01,71.58,2300;30.18,66.98,1100;32.16,74.19,2200;32.49,74.53,1000;"+
"29.40,71.68,800;32.08,72.67,700;27.70,68.86,550;25.12,62.32,100;34.56,69.21,4500;31.61,65.71,650;34.35,62.20,600;36.71,67.11,500;34.43,70.45,300;4.18,73.51,250;"+
// Central Asia, Middle East, Caucasus
"41.30,69.24,3000;39.65,66.96,550;39.77,64.43,300;40.78,72.34,500;40.38,71.78,300;40.99,71.67,700;43.24,76.95,2200;51.17,71.45,1300;42.32,69.59,1100;49.81,73.10,500;"+
"50.28,57.21,500;47.10,51.92,400;43.65,51.20,200;52.29,76.97,350;49.95,82.61,350;50.41,80.23,350;53.21,63.62,250;44.85,65.51,250;42.87,74.59,1100;40.53,72.80,300;"+
"38.56,68.77,900;40.28,69.62,200;37.96,58.33,1000;37.60,61.83,150;39.08,63.57,250;35.69,51.39,15000;36.30,59.60,3400;32.65,51.67,2200;38.08,46.29,1700;29.59,52.58,1600;"+
"35.84,50.94,1600;31.32,48.67,1300;34.64,50.88,1200;34.31,47.07,1000;37.55,45.08,800;37.28,49.58,700;30.28,57.08,600;31.90,54.37,600;29.50,60.86,600;34.80,48.51,550;"+
"36.68,48.49,450;27.18,56.27,600;36.57,53.06,300;33.31,44.36,7500;30.51,47.78,1500;36.34,43.13,1500;36.19,44.01,1000;32.03,44.34,700;32.62,44.02,700;35.56,45.43,700;"+
"35.47,44.39,600;24.71,46.68,7500;21.49,39.19,4700;21.42,39.83,2000;24.47,39.61,1400;26.42,50.09,1500;18.22,42.50,500;27.52,41.70,500;28.38,36.57,500;26.33,43.97,600;"+
"16.89,42.55,300;25.38,49.59,700;25.20,55.27,3500;25.34,55.42,1500;24.45,54.38,1500;24.21,55.74,700;25.29,51.53,2300;26.23,50.59,700;29.38,47.99,3000;23.59,58.41,1500;"+
"17.02,54.09,200;24.36,56.75,200;15.37,44.19,3000;12.79,45.03,1000;13.58,44.02,600;14.80,42.95,700;14.54,49.12,300;31.77,35.21,1000;32.09,34.78,4000;32.79,34.99,1100;"+
"31.25,34.79,300;31.52,34.45,2000;31.95,35.93,4000;32.55,35.85,500;29.53,35.01,150;33.89,35.50,2400;34.44,35.83,500;33.51,36.28,2500;36.20,37.13,2000;34.73,36.71,800;"+
"35.13,36.75,500;35.52,35.79,400;35.34,40.14,300;37.05,41.21,200;39.93,32.86,5700;38.42,27.14,3000;40.19,29.06,2100;36.90,30.71,1400;37.00,35.32,1800;37.07,37.38,2000;"+
"37.87,32.48,1400;38.73,35.48,1100;37.91,40.23,1000;36.80,34.63,1000;41.00,39.72,800;39.90,41.27,750;37.16,38.79,1100;41.29,36.33,700;38.50,43.38,500;39.75,37.02,400;"+
"38.35,38.31,500;40.77,29.92,1000;40.74,30.40,500;39.78,30.52,700;37.78,29.09,650;41.68,26.56,200;36.20,36.16,400;41.72,44.78,1200;41.64,41.64,200;42.27,42.70,150;"+
"40.18,44.51,1100;40.79,43.85,120;40.41,49.87,2400;40.68,46.36,330;"+
// Siberia & Russian Far East
"55.01,82.93,1600;54.99,73.37,1100;56.01,92.87,1100;52.29,104.28,600;51.83,107.58,430;52.03,113.50,350;57.15,65.53,800;56.48,84.95,570;53.35,83.78,630;53.76,87.12,550;"+
"55.35,86.09,550;61.25,73.40,380;48.48,135.08,600;43.12,131.89,600;62.03,129.73,330;50.29,127.53,220;46.96,142.74,200;53.02,158.65,180;59.57,150.80,90;69.35,88.20,180;"+
"55.44,65.34,300;53.72,91.43,200;56.13,101.61,220;50.55,137.01,250;"+
// Africa
"30.04,31.24,22000;31.20,29.92,5500;31.04,31.38,1000;30.79,31.00,700;31.26,32.30,750;29.97,32.55,700;27.18,31.18,600;25.69,32.64,500;24.09,32.90,350;28.10,30.75,600;"+
"26.56,31.69,500;30.59,32.27,500;27.26,33.81,200;30.58,31.50,800;29.31,30.84,500;29.07,31.10,500;26.16,32.72,400;32.89,13.19,1200;32.12,20.07,800;32.38,15.09,400;"+
"27.04,14.43,150;36.81,10.18,2500;34.74,10.76,800;35.83,10.64,600;36.75,3.06,3500;35.70,-0.63,1500;36.37,6.61,1000;36.90,7.77,600;36.19,5.41,500;35.56,6.17,450;"+
"34.85,5.73,350;32.49,3.67,200;31.95,5.33,200;22.79,5.52,150;34.88,-1.31,300;33.57,-7.59,4300;34.02,-6.84,2000;34.03,-5.00,1200;31.63,-8.01,1100;35.76,-5.83,1100;"+
"33.90,-5.55,700;30.42,-9.60,900;34.68,-1.91,500;35.57,-5.37,400;27.15,-13.20,250;18.09,-15.98,1300;14.72,-17.47,3500;14.79,-16.93,400;16.03,-16.49,250;13.45,-16.58,500;"+
"11.86,-15.60,500;9.64,-13.58,2000;8.48,-13.23,1300;6.30,-10.80,1500;12.64,-8.00,2800;13.45,-6.26,200;14.49,-4.20,150;16.77,-3.01,50;16.27,-0.04,100;12.37,-1.53,3000;"+
"11.18,-4.30,1000;13.51,2.11,1400;13.81,8.99,600;13.50,7.10,500;16.97,7.99,150;5.36,-4.01,5500;7.69,-5.03,700;6.82,-5.28,300;4.75,-6.64,300;5.60,-0.19,4500;"+
"6.69,-1.62,3500;9.40,-0.85,700;4.90,-1.76,500;5.11,-1.25,200;6.13,1.22,2000;6.37,2.39,1500;6.50,2.60,300;9.34,2.63,300;6.52,3.38,15000;7.38,3.94,4000;"+
"12.00,8.52,4500;9.08,7.40,3500;4.82,7.03,3500;6.34,5.63,1800;10.52,7.44,1800;6.13,6.79,1500;5.11,7.37,1500;6.46,7.55,1000;11.85,13.16,1000;13.06,5.24,1000;"+
"12.99,7.60,500;9.90,8.86,1000;8.48,4.54,900;7.25,5.19,600;7.15,3.35,700;7.77,4.56,700;10.29,11.17,500;9.21,12.48,400;4.95,8.32,700;5.03,7.93,1000;"+
"5.48,7.03,1000;7.73,8.54,500;10.31,9.84,800;5.53,5.75,700;4.05,9.77,3500;3.87,11.52,4000;5.96,10.15,600;7.32,13.58,400;10.59,14.32,500;9.30,13.39,500;"+
"12.13,15.06,1500;8.57,16.08,300;13.83,20.83,200;4.36,18.56,900;0.39,9.45,900;3.75,8.78,300;1.86,9.77,300;-4.27,15.28,2500;-4.78,11.86,1200;-4.44,15.27,17000;"+
"-11.66,27.48,2500;-6.13,23.59,2000;-5.90,22.42,1500;0.52,25.20,1300;-1.68,29.23,1200;-2.51,28.86,1200;-10.72,25.47,600;0.05,18.26,500;-5.81,13.46,500;-5.04,18.82,500;"+
"0.49,29.47,400;-8.84,13.23,9000;-12.78,15.74,900;-12.58,13.41,800;-14.92,13.50,700;-9.54,16.34,400;-5.55,12.19,400;15.50,32.56,6000;19.62,37.22,600;13.63,25.35,700;"+
"13.18,30.22,600;12.05,24.88,800;14.40,33.52,600;15.45,36.40,500;4.85,31.58,500;9.53,31.66,150;7.70,27.99,200;9.03,38.74,5500;9.59,41.87,500;13.50,39.47,500;"+
"12.60,37.47,450;11.59,37.39,450;7.05,38.48,400;7.67,36.83,250;9.31,42.12,150;8.55,39.27,500;15.32,38.93,900;11.59,43.15,600;2.05,45.32,2500;9.56,44.07,1000;"+
"-0.36,42.54,200;3.12,43.65,500;-1.29,36.82,5000;-4.04,39.67,1400;-0.09,34.77,600;-0.30,36.07,600;0.51,35.27,500;-3.22,40.12,150;0.35,32.58,3500;0.44,33.20,300;"+
"2.77,32.30,300;-0.61,30.66,300;-1.95,30.06,1500;-3.38,29.36,1200;-6.79,39.21,7000;-3.37,36.68,700;-2.52,32.90,1200;-6.16,39.19,700;-6.17,35.74,500;-8.91,33.46,600;"+
"-5.07,39.10,300;-3.35,37.34,300;-6.82,37.66,400;-5.02,32.80,400;-4.88,29.63,300;-15.39,28.32,3000;-12.97,28.64,800;-12.80,28.21,700;-17.85,25.85,200;-14.44,28.45,200;"+
"-17.83,31.05,2200;-20.15,28.58,700;-18.97,32.67,250;-19.45,29.82,200;-13.96,33.79,1200;-15.79,35.01,1100;-11.46,34.02,250;-25.97,32.57,2800;-19.84,34.84,600;-15.12,39.27,800;"+
"-17.88,36.89,400;-16.16,33.59,300;-13.30,40.52,200;-23.86,35.38,100;-19.12,33.48,400;-26.20,28.05,10000;-25.75,28.19,3000;-33.92,18.42,4800;-29.86,31.02,3800;-33.96,25.60,1300;"+
"-29.12,26.21,800;-33.02,27.91,800;-29.60,30.38,700;-25.47,30.97,700;-23.90,29.45,400;-28.74,24.76,250;-33.96,22.46,200;-26.71,27.84,800;-25.67,27.24,600;-31.60,28.78,300;"+
"-28.78,32.04,300;-22.56,17.08,500;-22.95,14.51,100;-17.91,19.77,100;-17.79,15.70,100;-24.63,25.92,500;-21.17,27.51,150;-19.98,23.42,80;-29.31,27.48,350;-26.31,31.14,300;"+
"-18.88,47.51,3500;-18.15,49.40,350;-21.45,47.09,250;-15.72,46.32,250;-23.35,43.67,200;-12.28,49.29,150;-19.87,47.03,250;-20.16,57.50,900;-20.88,55.45,200;-4.62,55.45,100;"+
"-11.70,43.26,100;14.93,-23.51,150;"+
// Oceania & remote
"-33.87,151.21,5300;-37.81,144.96,5200;-27.47,153.03,2600;-31.95,115.86,2200;-34.93,138.60,1400;-28.02,153.40,700;-32.93,151.78,500;-35.28,149.13,460;-34.42,150.89,300;-26.65,153.07,350;"+
"-19.26,146.82,180;-16.92,145.77,160;-42.88,147.33,250;-12.46,130.84,150;-38.15,144.36,280;-37.56,143.85,110;-36.76,144.28,100;-27.56,151.95,140;-23.38,150.51,80;-21.14,149.19,80;"+
"-41.44,147.14,90;-32.25,148.60,50;-23.70,133.88,25;-30.75,121.47,30;-33.33,115.64,70;-35.12,147.37,65;-36.08,146.92,95;-20.73,139.49,20;-17.96,122.24,15;-28.77,114.61,40;"+
"-36.85,174.76,1700;-41.29,174.78,420;-43.53,172.64,400;-37.79,175.28,180;-37.69,176.17,150;-45.87,170.50,130;-39.49,176.91,130;-40.35,175.61,90;-41.27,173.28,50;-45.03,168.66,30;"+
"-46.41,168.35,55;-39.06,174.08,60;-38.14,176.25,55;-18.14,178.44,200;-17.73,168.32,50;-9.43,159.95,90;-22.27,166.46,180;-13.83,-171.76,40;-21.14,-175.20,30;-17.54,-149.57,140;"+
"13.44,144.79,170;64.18,-51.69,19;-27.15,-109.43,8"
).split(";").map(s => s.split(",").map(Number));

const RURAL = [
  // South Asia
  [26.5,82,450,.9],[25.5,86,350,.9],[24,89.8,280,1],[28.5,78,300,.7],[30.5,75.5,250,.6],[22.8,88,150,.8],[10,76.4,150,.7],[11,78.5,250,.5],
  [16.5,81,200,.5],[19,75,320,.35],[22.5,72.5,200,.4],[20.5,85.5,150,.4],[31,73,250,.6],[26,68.5,200,.35],[7.2,80.2,100,.4],[27.6,85,120,.35],
  // East Asia
  [35.5,116,500,.9],[31,120,250,.9],[30,113,300,.6],[30.2,105,280,.8],[22.8,113.5,120,.9],[24.5,117,250,.5],[27.5,113,300,.45],[34.4,108.5,150,.5],
  [44,125,350,.35],[23.5,109,250,.35],[26,105,250,.3],[36.5,127.5,200,.6],[35,136,300,.7],[36,139.8,200,.8],[33.5,131,150,.5],[24,120.6,120,.6],
  // Southeast Asia
  [-6.9,107.5,200,1],[-7.4,111.5,250,1],[15,120.8,200,.6],[10.5,123.5,200,.4],[20.8,106.2,120,.8],[10.2,105.8,150,.7],[15,108.5,200,.3],
  [14.5,100.5,200,.45],[15.5,103.5,250,.35],[18,95.8,300,.35],[3,99,200,.35],[-8.4,115.2,60,.7],
  // Africa
  [30.6,31,120,1],[28.5,30.8,80,.8],[26.5,31.8,80,.7],[25,32.7,60,.6],[7,5,350,.7],[11.5,8,300,.55],[6.5,-2,300,.4],[9,38.5,350,.5],
  [0,31,300,.6],[-0.5,36.5,200,.5],[-14,34,200,.4],[35,0,300,.35],[34,-6,250,.4],
  // Europe
  [51.3,6,300,.7],[52.5,-1.5,300,.6],[45.3,10,200,.6],[50,9.5,400,.45],[47,2.5,500,.3],[50.5,19.5,250,.4],[40.8,15,150,.4],
  // Americas
  [40.5,-74.5,350,.5],[41,-85,500,.25],[34,-82,500,.2],[34.5,-118,250,.4],[28,-81.8,300,.3],[31,-96.5,350,.2],[19.8,-100,300,.55],
  [-22.5,-46,400,.45],[-8,-36,300,.35],[5,-75,300,.3],[-34.5,-60,200,.3],
  // Middle East
  [33,44.5,300,.35],[33,35.8,150,.4],[37,48,300,.25],
];

const RANGES = [
  // North America
  [3.0,.8,[[-105.5,35.5],[-105.8,37.5],[-106.3,39.3],[-106.8,40.8],[-108.5,42.8],[-110.2,43.8],[-110.9,45.3],[-113.5,47.5],[-114.5,49],[-116,50.8],[-118.5,52.8],[-121,55],[-123.5,57.5],[-126,59.5],[-129,61.5]]],
  [1.2,.6,[[-111.7,39.5],[-111.8,41.5],[-110.5,40.7]]],
  [3.0,.3,[[-112,36.5],[-109.5,37.5],[-107.5,36.5]]],
  [1.0,.8,[[-121.5,40.2],[-120.2,38.8],[-119,37.5],[-118.3,36.3],[-118.4,35.4]]],
  [1.2,.6,[[-121.5,40.5],[-122.1,42.5],[-121.8,44.5],[-121.7,46.2],[-121.3,48],[-121.5,49.2]]],
  [2.0,.7,[[-122.5,49.5],[-124.5,51.5],[-127.5,54],[-130.5,56.5],[-134,59],[-138,60.3],[-141,60.8],[-145,61.3]]],
  [1.5,.8,[[-146,63.3],[-149,63.3],[-151,63],[-153.5,61.5],[-155,60]]],
  [1.5,.5,[[-162,68.2],[-155,68.2],[-148,68.3],[-142,68.9]]],
  [3.5,.3,[[-118.5,39.5],[-115.5,39.8],[-114,40]]],
  [1.8,.4,[[-85.8,34],[-84.2,35.3],[-82.8,36.3],[-80.8,37.6],[-79.2,39.2],[-77.5,40.6],[-75.5,41.8],[-74.2,43.3]]],
  [1.2,.35,[[-72.8,43.5],[-71.3,44.3],[-69.5,45.3]]],
  [1.0,.35,[[-74.6,43.8],[-74.0,44.2]]],
  [2.0,.2,[[-94,36],[-91.5,37]]],
  [2.0,.6,[[-109.5,30.5],[-107.5,28],[-106,25.5],[-104.5,23],[-103.5,21]]],
  [1.4,.55,[[-101.5,28],[-100.5,25.5],[-99.5,23],[-98.2,20.5]]],
  [1.0,.7,[[-104.5,19.8],[-101.5,19.6],[-99,19.2],[-97.3,19]]],
  [1.2,.5,[[-101,17.8],[-97.5,16.8],[-95.5,16.5]]],
  [1.0,.5,[[-92,15.2],[-90.5,14.8],[-88.5,14.3],[-86.5,13.3],[-85,11.5],[-84,9.8],[-82.5,8.8]]],
  [2.0,.45,[[-128,62],[-131,64],[-134,66]]],
  // South America
  [2.2,1,[[-72.5,11],[-73.5,8.5],[-75.5,6],[-76.5,3.5],[-77.8,1],[-78.6,-1.5],[-79,-4],[-78.2,-7],[-77,-9.5],[-75.5,-12],[-72.5,-14.5],[-70,-16.5],[-68.5,-19],[-68,-22],[-68.3,-25],[-69,-28],[-70,-31],[-70,-33.5],[-70.5,-36],[-71.2,-39],[-71.7,-42],[-72.5,-45],[-73.2,-48],[-73.3,-51],[-72.2,-53.5]]],
  [4.0,.7,[[-70,-15.5],[-68,-19.5],[-67,-23]]],
  [1.0,.5,[[-72,7.8],[-70.5,8.8],[-68.5,10],[-66,10.3]]],
  [3.0,.35,[[-64.5,5],[-62,5.5],[-60,5.2]]],
  [1.5,.35,[[-48,-25.5],[-45,-23],[-43,-22],[-41.5,-20]]],
  [1.2,.3,[[-43.7,-19.5],[-43,-16]]],
  // Europe
  [1.6,.9,[[5.8,44],[6.8,45],[7.2,45.9],[8.3,46.4],[9.8,46.5],[11.5,47],[13,47.1],[14.5,47.3],[16,47.6]]],
  [0.9,.7,[[-1.8,43],[0,42.7],[1.5,42.6],[3,42.4]]],
  [0.8,.5,[[-7,43],[-5,43],[-3.5,43.1]]],
  [1.0,.4,[[-6.5,40.3],[-4,40.6],[-2,41.5]]],
  [0.8,.6,[[-4.5,37],[-2.8,37.1]]],
  [1.0,.5,[[8.5,44.4],[10.5,44.2],[12.2,43.4],[13.4,42.4],[14.5,41.5],[15.5,40.5],[16.2,39.3]]],
  [1.3,.55,[[17.5,49],[19.5,49.3],[22,49.1],[24.5,47.8],[25.6,46.5],[25.8,45.6],[24,45.4],[22.5,45.2]]],
  [1.3,.5,[[14.5,45.8],[16,44.6],[17.5,43.6],[19,42.8],[20,42]]],
  [0.8,.45,[[22.5,43.3],[25,42.8],[26.8,42.7]]],
  [1.0,.45,[[23.5,41.8],[25.5,41.6]]],
  [1.0,.5,[[20.7,40.5],[21.3,39.2],[22,38.4]]],
  [2.3,.5,[[6.5,58.8],[7.5,60.5],[8.5,62],[11,63.3],[13.5,65.2],[15.5,66.7],[17.5,68],[20,69],[23,70]]],
  [1.4,.35,[[-5.5,56.3],[-4.5,57],[-4.8,58]]],
  [1.5,.35,[[2.5,44.8],[3.3,45.8]]],
  [1.3,.85,[[37.5,44.5],[40,43.5],[42.5,43],[44.5,42.7],[47,41.8],[49,41]]],
  [1.5,.35,[[59,51],[58.5,54],[59.3,57],[59.5,60],[59.5,63],[60.5,65.5],[64,67.8],[66,68.5]]],
  [1.8,.4,[[-21,64.7],[-18,64.8],[-16,64.5]]],
  // Africa
  [1.5,.65,[[-9.5,30.5],[-7.5,31.2],[-5.5,32.5],[-3,33.5],[0,34.5],[3,35.5],[6,35.3],[8.5,35.5]]],
  [2.0,.5,[[4.8,23],[6.3,23.5]]],
  [2.0,.55,[[17,21],[18.5,20.5]]],
  [1.2,.3,[[8.5,18.5],[9,17.5]]],
  [3.5,.7,[[37.5,14.5],[38.5,12],[38.8,9.5],[37.5,7.5],[39.5,7.3],[40.5,8.8]]],
  [1.6,.55,[[36,1.5],[36.7,-0.5],[37.3,-3],[35.8,-4.5]]],
  [1.4,.5,[[29.8,0.5],[29.2,-2],[29.5,-4],[30.5,-7.5],[33.8,-9.5]]],
  [1.3,.6,[[27,-30.8],[28.8,-29.5],[29.5,-28.5],[30.5,-26.5]]],
  [1.0,.35,[[19.5,-32.5],[22,-32.5],[25,-32]]],
  [1.2,.35,[[16,-20],[16.2,-23],[16.8,-26]]],
  [1.8,.45,[[49.5,-14],[48,-17.5],[47.2,-20],[46.8,-22.5]]],
  [1.0,.45,[[9.2,4.2],[10.5,6],[12,7.3]]],
  [1.0,.3,[[33.5,26.5],[35,23],[36.5,20]]],
  // Asia
  [2.0,1,[[73.5,35],[75.5,33.5],[77.5,32.3],[79.5,30.6],[81.5,29.7],[84,28.4],[86.9,27.9],[88.8,27.8],[90.5,28],[92.5,27.9],[94.5,28.8],[96.5,28.5]]],
  [7.0,.6,[[80,33.5],[85,33],[90,33],[95,33.5],[99,32.5]]],
  [1.4,1,[[74,36.5],[76.5,35.7],[78,34.8]]],
  [1.8,.8,[[68,35],[70,35.7],[71.5,36.3],[73.5,36.6]]],
  [2.2,.85,[[72,38.3],[74.5,38.5]]],
  [2.2,.75,[[69,42],[72,41.8],[75.5,41.5],[78.5,42.2],[81,42.8],[84,43.3],[87,43.4],[90,43],[94,43]]],
  [1.8,.75,[[76,36.5],[80,36],[85,36],[90,36],[95,35.8],[99,35.2]]],
  [2.0,.55,[[85,50],[88,49.5],[90.5,48.5],[94,46.5],[97,45]]],
  [1.6,.45,[[89,52.5],[94,52],[99,51.5],[102,51.8]]],
  [2.5,.7,[[99,31],[99.5,28.5],[99.5,26],[100,23.5]]],
  [1.0,.45,[[104,34],[107,33.8],[110,33.7]]],
  [1.0,.35,[[113,40],[113.5,37],[113.3,35]]],
  [1.5,.3,[[120,53],[121,50],[119.5,47],[118,44]]],
  [1.4,.35,[[128,42],[129.3,43.5]]],
  [1.0,.35,[[128.5,38.2],[128.8,36.8],[128.2,35.5]]],
  [1.3,.55,[[130.8,32.5],[132.5,34.3],[134.5,35.2],[136.5,35.9],[137.7,36.2],[138.8,36.8],[140,38.5],[140.7,40.5]]],
  [1.2,.45,[[142.2,42.8],[142.8,43.5],[143.5,44]]],
  [0.8,.6,[[120.8,22.5],[121.2,24.3]]],
  [2.0,.6,[[45.5,37],[46.5,35],[48,33.5],[50,31.5],[52,30],[54,28.5],[57,27.5]]],
  [1.0,.65,[[47.5,37.5],[49.5,36.7],[52,36.1],[54.5,36.6],[57,37.3]]],
  [1.4,.5,[[29,36.8],[31.5,37],[34,37.2],[36.5,37.8],[39,38.5],[42,38.8],[43.5,39.3]]],
  [1.2,.4,[[31,41],[35,41],[38.5,40.7],[41.5,40.9]]],
  [0.7,.4,[[35.7,33.5],[36.3,34.5]]],
  [1.5,.45,[[36.5,27],[38.5,24],[40,21],[42.5,18],[44,15]]],
  [0.9,.45,[[56.2,25.8],[57.5,23.2],[59,22.5]]],
  [1.0,.4,[[73.8,20],[73.8,17],[74.3,14.5],[75.3,12.3],[76.7,10.3],[77.3,8.5]]],
  [1.4,.45,[[94.5,26],[93.5,23.5],[94,20],[94.6,17]]],
  [1.2,.4,[[104.5,19.5],[106.5,17],[107.8,14.5],[108.3,12]]],
  [2.0,.4,[[98.5,21],[99,18.5],[98.8,16.5]]],
  [0.9,.45,[[95.5,5],[98,2.5],[100.5,-0.5],[102.5,-3.5],[104.5,-5.5]]],
  [0.6,.4,[[106.5,-6.8],[110,-7.3],[113,-7.9],[114.3,-8.1]]],
  [1.3,.4,[[116.5,6],[115.5,3],[114.5,1],[113,-0.5]]],
  [1.8,.7,[[134,-3.5],[137.5,-4],[140.5,-4.8],[143.5,-5.8],[146.5,-6.8],[149,-9.5]]],
  [0.8,.45,[[120.9,18.2],[120.9,16.5]]],
  [1.0,.3,[[124.5,7.5],[125.5,8.5]]],
  [2.0,.4,[[127,70],[129,67],[134,64.5],[138,63]]],
  [2.0,.4,[[140,67],[145,65],[150,63]]],
  [1.3,.5,[[156.5,51.5],[158.5,54],[160,56.5],[161,58.5]]],
  [1.5,.3,[[110,52.5],[118,55.5],[125,56],[132,56]]],
  [0.8,.35,[[56,38.3],[58.5,37.8],[60.5,36.5]]],
  [1.2,.45,[[69.5,33],[69.3,31],[68.8,29.5]]],
  [1.0,.3,[[67.5,28],[67.5,26]]],
  [1.8,.4,[[98,48],[101,47.3],[103,47]]],
  // Oceania
  [1.5,.35,[[145.5,-16],[146.5,-19.5],[148.5,-23],[151,-27],[152,-30.5],[150.3,-33.5],[149,-35.8],[147.5,-37]]],
  [0.8,.25,[[132,-23.7],[135,-23.6]]],
  [0.6,.25,[[138.5,-31],[138.7,-32.5]]],
  [1.1,.75,[[166.8,-45.8],[168.5,-44.5],[170.5,-43.5],[172,-42.5],[173.5,-41.7]]],
  [0.8,.45,[[175.6,-39.3],[176.3,-38.2]]],
  [1.0,.3,[[146,-41.8],[146.5,-42.5]]],
];

/* Painted biomes: [lon, lat, radius-x deg, radius-y deg, color, strength] */
const BIOMES = [
  // Deserts & drylands
  [-8,22,12,7,"#cdac6c",.95],[5,23,13,8,"#d4b479",.95],[18,22,12,8,"#d2b176",.95],[28,24,8,7,"#d8bb82",.95],[0,28,12,4,"#caa86c",.9],[12,29,8,3,"#cfae72",.85],
  [0,15,25,3,"#a38e56",.55],[45,23,9,7,"#d2b27a",.95],[52,20,5,4,"#d9bd86",.9],[38,28,5,4,"#c9aa74",.85],[58,30,9,5,"#bb9f70",.8],[71,27,5,3,"#bb9d69",.7],
  [62,42,10,5,"#b9a87b",.8],[83,39,7,3,"#d0b582",.95],[105,43,11,4,"#ad9d72",.85],[94,41,6,3,"#b8a47a",.8],[88,33,12,4,"#8e8266",.8],[70,48,15,4,"#8f8b5a",.55],
  [128,-25,14,7,"#c28a52",.9],[138,-28,8,5,"#bd8c5a",.8],[121,-24,6,5,"#c6814a",.85],[133,-19,9,3,"#b38a55",.6],
  [20,-23,7,6,"#b89b62",.8],[15,-24,2,5,"#d2aa72",.9],[46,8,5,4,"#aa9262",.7],[40,12,4,4,"#a8905e",.5],
  [-112,34,7,5,"#b69b6d",.8],[-106,30,5,4,"#b2986b",.7],[-117,39,4,4,"#aa9a70",.7],[-110,40,4,3,"#a8956c",.55],
  [-70,-23,1.6,6,"#cbb086",.9],[-68,-45,4,6,"#a99c6e",.8],[-102,41,7,6,"#948f5a",.45],[-65,-30,5,6,"#8f8a58",.4],
  // Forests
  [-62,-4,14,8,"#1f4d1c",.85],[-52,-8,6,5,"#2a5a24",.55],[20,0,10,6,"#21501e",.85],[-5,7,10,3,"#2c5a22",.6],[103,12,8,8,"#2a5a24",.55],
  [114,0,8,4,"#1f4d1c",.85],[102,-1,5,4,"#1f4d1c",.8],[141,-5,7,3,"#1f4d1c",.85],[-87,14,5,4,"#2a5a24",.6],[-76,5,4,5,"#245220",.6],
  [-82,37,9,7,"#3d6030",.55],[10,50,15,7,"#566f3b",.45],[113,30,9,7,"#4c6834",.45],[128,45,6,5,"#3f5e30",.45],[120,15,3,5,"#2d5c26",.5],
  [-123,48,4,6,"#2c5130",.6],[-72,-40,2,6,"#2f5a2c",.5],[147,-37,3,3,"#3f6030",.4],[173,-42,3,4,"#3f6334",.45],
  // Savanna & farm belts
  [78,20,8,8,"#7a7a45",.5],[83,26,7,2.5,"#58733a",.55],[-47,-15,8,6,"#7d7e46",.5],[35,-5,8,10,"#817d47",.5],[15,10,20,3,"#7d7744",.45],
  [27,-15,10,5,"#6f7440",.4],[-60,-33,6,4,"#6f7a42",.4],[-97,38,6,5,"#7b8250",.4],[33,49,12,4,"#7c8350",.45],[0,46,6,4,"#6a7a44",.35],
  // Boreal & tundra
  [-100,57,28,6,"#2d4a2c",.7],[100,60,45,7,"#2e472c",.7],[25,63,12,4,"#34502f",.6],[-150,63,8,4,"#3b5234",.55],
  [-105,68,35,4,"#7a7862",.7],[100,70,50,4,"#7b7863",.7],[-160,68,8,3,"#7c7a64",.6],
  [-95,74,30,5,"#8c8876",.85],[-80,70,10,3,"#86826e",.7],[100,75,45,3,"#8a8674",.8],[60,74,8,3,"#8a8674",.7],
  // Ice
  [-41,74,12,9,"#eef2f5",.97],[-42,66,6,5,"#e6ecf0",.9],[-95,76,20,4,"#dfe6ea",.7],[18,79,6,2,"#e4eaee",.8],[60,76,6,2,"#e2e8ec",.7],
];

/* A very rough world outline, used only if both map sources fail to load. */
const ROUGH_LAND = [
[[-168,66],[-162,70],[-156,71.3],[-140,69.6],[-128,70],[-115,68.5],[-95,72],[-82,73],[-80,63],[-94,59],[-92,57],[-82,55],[-79,52],[-77,60],[-70,59],[-64,60],[-56,53],[-60,47],[-66,44.5],[-70,41.5],[-74,40.5],[-76,35],[-81,31],[-80.5,25.5],[-82.5,28],[-84,30],[-89,30],[-94,29.5],[-97.5,26],[-97.5,21],[-94,18.5],[-91,18.5],[-87,21.5],[-88,16],[-83.5,15],[-83.5,11],[-79.5,9],[-77.5,8],[-80,7.5],[-86,11.5],[-92,14.5],[-96,15.7],[-105,19.5],[-106,23.5],[-110,26],[-112.5,29],[-114.7,31.8],[-117,32.5],[-120.5,34.5],[-122.5,37.5],[-124.2,40.5],[-124,46],[-124.7,48.4],[-123,49],[-127,50.5],[-130,54.5],[-135,57.5],[-140,59.8],[-146,60.5],[-152,59],[-158,57],[-164,54.8],[-158,58.5],[-162,60],[-165,62.5],[-164.5,64.5],[-168,66]],
[[-77.5,8],[-72,12],[-64,10.5],[-60,8.5],[-52,5],[-50,0],[-44,-2.5],[-35,-5.5],[-35,-9],[-39,-13.5],[-39,-18],[-41,-22],[-44,-23],[-48.5,-26],[-48.5,-28.5],[-53,-33.5],[-58,-34.5],[-57,-36.5],[-62,-39],[-65,-41],[-64,-43],[-67.5,-46],[-66,-48],[-69,-51],[-68.5,-53],[-71,-54],[-74.5,-52],[-75.5,-47],[-73.5,-42],[-73.5,-37],[-71.5,-33],[-71.5,-28],[-70.3,-18.5],[-75.5,-15],[-78,-10],[-81.2,-5.5],[-80,-2],[-80,1],[-78.5,2.5],[-77.5,4],[-77.5,8]],
[[-9.5,43],[-9,38.8],[-6,36.2],[-2,36.8],[0,39],[3,42.5],[6.5,43.2],[9,44.3],[12.5,44],[15.5,41],[16.5,38],[18.5,40.2],[16,41.5],[13.5,45.6],[19.5,42],[20,39.5],[22.5,36.5],[24,38],[26,40.5],[28.5,41],[27,37],[29.5,36.2],[36,36.2],[35.5,33],[34.5,31],[32.5,31],[34,28],[35,28],[39,22],[43,13],[45,12.8],[52,16],[56,18],[59.8,22.5],[57,24],[56.3,26.2],[54,24],[51.5,24.5],[50,26.5],[48,29.5],[50,30],[54,27],[57,25.5],[61.5,25.2],[66.5,25.4],[70,21],[72.8,19],[73.5,15.5],[76.5,8.5],[78,8],[80.3,13],[80,15.5],[82.5,17],[87,21.2],[89,22],[92,21.5],[94.5,17],[97.5,16.5],[98.5,13],[99,10.5],[98.3,8],[100.5,3.5],[103.5,1.3],[104,2.8],[103.3,5],[101.2,6.8],[99.9,12.8],[102.5,12],[105,8.8],[109,11.5],[109,15.5],[106.5,18],[106.7,20.7],[108.5,21.6],[111,21.4],[114,22.3],[117,23.5],[119.8,26.5],[121.8,30.5],[121,32.5],[120.3,34.5],[119,35],[122.5,37],[119.3,37.5],[117.8,38.5],[121.5,40],[125,39.6],[126.5,34.5],[129.3,35.3],[129.5,37.5],[128,39.2],[129.8,41],[132,43],[135.5,43.8],[140.5,48.5],[141,52.5],[137,54],[135,56.5],[140.5,58],[143.5,59.5],[150,59.6],[155,59.3],[156.5,61.5],[160,61.8],[163.5,60],[162,58],[156,51],[160,54.5],[162,56.2],[164,59.8],[170,60],[177,62.5],[180,65],[180,68.9],[171,69.8],[160,69.6],[150,71.5],[140,72.5],[129,72.2],[120,73],[113,73.8],[108,76.5],[104,77.7],[98,76],[89,75.5],[80.5,73.5],[80,72],[75,72.5],[72.5,69],[66,69],[68.5,72.5],[62,70],[60,68.5],[55,68.5],[53.5,67],[44,68],[41,66.5],[34,69.4],[29.5,70.5],[25,71.1],[16,68.5],[12.5,65.5],[10.5,63.5],[5,62],[5,59],[7,58],[10.5,59],[11.5,58.5],[12.5,56.3],[16,56.3],[16.5,57.8],[18.5,60],[17.5,61.5],[21.5,64],[25.5,65.3],[22,61],[23.5,59.9],[29,60],[23.5,59.3],[23.5,58],[21.5,57.3],[21,56],[18,54.8],[14,54],[10.5,54.5],[8.5,55.5],[8.5,57],[10.5,57.7],[10,54.8],[8.8,53.9],[7,53.5],[4.5,52.5],[3.5,51.3],[1.7,50.9],[-1.5,49.7],[-2.2,48.6],[-4.7,48.4],[-2,47],[-1.2,44.5],[-1.8,43.4],[-9.5,43]],
[[-17,21],[-16.5,14.5],[-17.5,14.7],[-15,11],[-13,8],[-8,4.5],[-3,5],[2,6.3],[5,5.5],[6.5,4.3],[9.5,4],[9.5,2],[9,-1],[12,-5],[13.5,-11],[11.8,-17],[14.5,-22.5],[15.3,-27],[18.5,-34.3],[20,-34.8],[25.5,-34],[30.5,-31],[32.8,-26.5],[35.5,-24],[35,-20],[40.5,-15],[40.3,-10.5],[39.3,-6.5],[41,-1.5],[43.5,1.5],[48,5],[51.2,11.8],[45,10.5],[43.3,11.5],[42.5,14],[39.5,15.5],[37,21],[35.5,24],[33.5,28],[32.3,31],[29.5,31],[25,31.8],[20,30.8],[19.8,31.8],[15,32.3],[11,33.3],[10,37.2],[5,36.8],[-1,35.2],[-5.9,35.8],[-9.5,32],[-9.8,29.6],[-13,27.6],[-17,21]],
[[113.5,-22],[114,-26],[115,-34],[118,-35],[123,-34],[129,-31.7],[134,-32.5],[136,-35],[138,-35.6],[140,-38],[144,-38.5],[147.5,-38],[150,-37.5],[151.3,-33.5],[153.5,-28.5],[153,-25],[150.5,-22.5],[149,-20],[146,-18.5],[145.4,-15],[143.5,-12.8],[142.5,-10.7],[141.5,-13],[141.5,-16],[139.5,-17.5],[136.7,-15.8],[135.5,-14.5],[136.8,-12.2],[132.5,-11.5],[130,-13],[129.5,-15],[126,-14],[122.5,-17],[121,-19.5],[117,-20.5],[113.5,-22]],
[[-73,78.5],[-62,82],[-40,83.5],[-22,82.5],[-18,77],[-21,70.5],[-24,68.5],[-32,68],[-40,65],[-43,60],[-48,61],[-51,64],[-54,67.5],[-55,71],[-58,75.5],[-66,76.3],[-73,78.5]],
[[-180,-90],[-180,-72],[-120,-73],[-90,-72],[-65,-64],[-58,-63.3],[-60,-66],[-62,-70],[-45,-78],[-30,-76],[0,-70],[30,-69],[60,-67],[90,-66],[120,-66],[150,-68.5],[165,-71],[170,-73],[165,-78],[180,-78],[180,-90],[-180,-90]],
[[-5.7,50],[1.5,51.2],[1.7,52.7],[0,53.5],[-1.7,55.6],[-3,58.6],[-5,58.6],[-6,56.8],[-5,55],[-3,54.9],[-3.4,53.4],[-4.7,52.8],[-5.2,51.7],[-3,51.5],[-5.7,50]],
[[-6,52.2],[-6,54],[-7.3,55.3],[-10,54.2],[-10.3,51.8],[-8,51.6],[-6,52.2]],
[[130.9,33.9],[132.5,35.3],[136,35.7],[137,37],[139.5,38],[140,40.5],[141.5,41.4],[142,39],[141,36.5],[140.8,35],[139,34.7],[137,34.6],[135,33.5],[132,33.8],[130.9,33.9]],
[[140,41.5],[141.5,45.4],[145.5,43.3],[143.3,42],[140,41.5]],
[[49.3,-12],[50.5,-15.5],[49.5,-17],[47.2,-25],[45,-25.3],[43.3,-22],[44.5,-16.3],[47,-15],[49.3,-12]],
[[172.7,-34.5],[178.5,-37.7],[177,-39.5],[175,-41.5],[173.5,-40.8],[174.5,-38.5],[172.7,-34.5]],
[[172.7,-40.5],[174.3,-41.7],[172.8,-43.7],[171,-45],[169,-46.6],[166.5,-46],[168,-44],[172.7,-40.5]],
[[109,1.5],[111.5,-3],[116,-4],[117.5,0],[119,5],[117,7],[114.5,4.5],[110,2],[109,1.5]],
[[95.3,5.5],[98.5,4],[104,-2],[106,-6],[104.5,-5.9],[101,-2.5],[98,1],[95.3,5.5]],
[[105.3,-6.8],[110,-6.9],[114.5,-7.7],[114.4,-8.7],[110,-8.2],[106,-7.4],[105.3,-6.8]],
[[131,-1.2],[137,-1.5],[141,-2.6],[145.5,-4.5],[147.5,-6],[150,-10.5],[147,-10],[143.5,-9],[141,-9.1],[138,-8.3],[137.8,-5],[133,-4],[131,-1.2]],
[[120,18.5],[122.3,18.5],[121.5,14.5],[124,13],[120.6,13.8],[120,16.5],[120,18.5]],
[[79.8,9.8],[81.9,7.5],[81.2,6.2],[80,6],[79.8,9.8]],
[[120.1,23],[121,25.2],[121.9,24.8],[120.8,21.9],[120.1,23]],
[[-24,65.5],[-22,66.4],[-16,66.5],[-13.5,65],[-18.5,63.4],[-22.7,63.8],[-24,65.5]],
[[-85,21.8],[-81,23.1],[-77,22],[-74.2,20.2],[-77.5,19.8],[-80.5,21.5],[-85,21.8]],
[[-74.5,18.4],[-72,19.9],[-68.4,18.6],[-71,18],[-74.5,18.4]],
[[11,78.5],[17,80],[27,80],[22,78],[16,76.5],[11,78.5]],
[[-90,72],[-80,74],[-68,70],[-62,66.5],[-66,62],[-73,64.5],[-78,68],[-90,72]],
[[-90,76.5],[-70,77],[-62,82],[-80,83],[-95,80],[-90,76.5]],
[[-117,70],[-103,69],[-101,71.5],[-110,73.5],[-118,72.5],[-117,70]],
[[-59.5,47.7],[-55.5,51.6],[-53.5,49],[-52.8,47],[-56,47.5],[-59.5,47.7]],
];
