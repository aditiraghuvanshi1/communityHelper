// Curated location choices for all Indian states and Union Territories.
// Complaint coordinates are always taken from the user's selected map pin.
export interface TownNode { name: string; localities: string[] }
export interface DistrictNode { name: string; towns: TownNode[] }
export interface StateNode { name: string; districts: DistrictNode[] }

const locations: Record<string, [string, string[]][]> = {
  "Andhra Pradesh": [["Visakhapatnam", ["Visakhapatnam"]], ["Vijayawada", ["Vijayawada"]], ["Guntur", ["Guntur"]], ["Tirupati", ["Tirupati"]], ["Kurnool", ["Kurnool"]], ["Nellore", ["Nellore"]]],
  "Arunachal Pradesh": [["Papum Pare", ["Itanagar"]], ["West Kameng", ["Bomdila"]], ["Tawang", ["Tawang"]]],
  "Assam": [["Kamrup Metropolitan", ["Guwahati"]], ["Dibrugarh", ["Dibrugarh"]], ["Cachar", ["Silchar"]], ["Jorhat", ["Jorhat"]], ["Sonitpur", ["Tezpur"]]],
  "Bihar": [["Patna", ["Patna"]], ["Gaya", ["Gaya"]], ["Muzaffarpur", ["Muzaffarpur"]], ["Bhagalpur", ["Bhagalpur"]], ["Darbhanga", ["Darbhanga"]]],
  "Chhattisgarh": [["Raipur", ["Raipur"]], ["Durg", ["Bhilai", "Durg"]], ["Bilaspur", ["Bilaspur"]], ["Bastar", ["Jagdalpur"]]],
  "Goa": [["North Goa", ["Panaji", "Mapusa"]], ["South Goa", ["Margao", "Vasco da Gama"]]],
  "Gujarat": [["Ahmedabad", ["Ahmedabad"]], ["Surat", ["Surat"]], ["Vadodara", ["Vadodara"]], ["Rajkot", ["Rajkot"]], ["Gandhinagar", ["Gandhinagar"]], ["Bhavnagar", ["Bhavnagar"]]],
  "Haryana": [["Gurugram", ["Gurugram"]], ["Faridabad", ["Faridabad"]], ["Hisar", ["Hisar"]], ["Karnal", ["Karnal"]], ["Panipat", ["Panipat"]]],
  "Himachal Pradesh": [["Shimla", ["Shimla"]], ["Kangra", ["Dharamshala"]], ["Solan", ["Solan"]], ["Mandi", ["Mandi"]]],
  "Jharkhand": [["Ranchi", ["Ranchi"]], ["East Singhbhum", ["Jamshedpur"]], ["Dhanbad", ["Dhanbad"]], ["Bokaro", ["Bokaro"]]],
  "Karnataka": [["Bengaluru Urban", ["Bengaluru"]], ["Mysuru", ["Mysuru"]], ["Mangaluru", ["Mangaluru"]], ["Belagavi", ["Belagavi"]], ["Kalaburagi", ["Kalaburagi"]], ["Dharwad", ["Hubballi", "Dharwad"]], ["Shivamogga", ["Shivamogga"]]],
  "Kerala": [["Thiruvananthapuram", ["Thiruvananthapuram"]], ["Ernakulam", ["Kochi"]], ["Kozhikode", ["Kozhikode"]], ["Thrissur", ["Thrissur"]], ["Kollam", ["Kollam"]], ["Kannur", ["Kannur"]]],
  "Madhya Pradesh": [["Indore", ["Indore"]], ["Bhopal", ["Bhopal"]], ["Jabalpur", ["Jabalpur"]], ["Gwalior", ["Gwalior"]], ["Ujjain", ["Ujjain"]]],
  "Maharashtra": [["Mumbai Suburban", ["Mumbai"]], ["Pune", ["Pune"]], ["Nagpur", ["Nagpur"]], ["Nashik", ["Nashik"]], ["Thane", ["Thane"]], ["Chhatrapati Sambhajinagar", ["Chhatrapati Sambhajinagar"]], ["Kolhapur", ["Kolhapur"]]],
  "Manipur": [["Imphal West", ["Imphal"]], ["Bishnupur", ["Bishnupur"]], ["Churachandpur", ["Churachandpur"]]],
  "Meghalaya": [["East Khasi Hills", ["Shillong"]], ["West Garo Hills", ["Tura"]]],
  "Mizoram": [["Aizawl", ["Aizawl"]], ["Lunglei", ["Lunglei"]]],
  "Nagaland": [["Kohima", ["Kohima"]], ["Dimapur", ["Dimapur"]], ["Mokokchung", ["Mokokchung"]]],
  "Odisha": [["Khordha", ["Bhubaneswar"]], ["Cuttack", ["Cuttack"]], ["Ganjam", ["Berhampur"]], ["Sambalpur", ["Sambalpur"]], ["Puri", ["Puri"]]],
  "Punjab": [["Ludhiana", ["Ludhiana"]], ["Amritsar", ["Amritsar"]], ["Jalandhar", ["Jalandhar"]], ["Patiala", ["Patiala"]], ["SAS Nagar", ["Mohali"]]],
  "Rajasthan": [["Jaipur", ["Jaipur"]], ["Jodhpur", ["Jodhpur"]], ["Udaipur", ["Udaipur"]], ["Kota", ["Kota"]], ["Ajmer", ["Ajmer"]], ["Bikaner", ["Bikaner"]]],
  "Sikkim": [["Gangtok", ["Gangtok"]], ["Namchi", ["Namchi"]]],
  "Tamil Nadu": [["Chennai", ["Chennai"]], ["Coimbatore", ["Coimbatore"]], ["Madurai", ["Madurai"]], ["Tiruchirappalli", ["Tiruchirappalli"]], ["Salem", ["Salem"]], ["Tirunelveli", ["Tirunelveli"]], ["Tiruppur", ["Tiruppur"]], ["Erode", ["Erode"]], ["Thanjavur", ["Thanjavur"]], ["Vellore", ["Vellore"]]],
  "Telangana": [["Hyderabad", ["Hyderabad"]], ["Hanamkonda", ["Warangal"]], ["Karimnagar", ["Karimnagar"]], ["Nizamabad", ["Nizamabad"]], ["Khammam", ["Khammam"]]],
  "Tripura": [["West Tripura", ["Agartala"]], ["Gomati", ["Udaipur"]]],
  "Uttar Pradesh": [["Lucknow", ["Lucknow"]], ["Gautam Buddha Nagar", ["Noida", "Greater Noida"]], ["Varanasi", ["Varanasi"]], ["Agra", ["Agra"]], ["Prayagraj", ["Prayagraj"]], ["Kanpur Nagar", ["Kanpur"]], ["Ghaziabad", ["Ghaziabad"]], ["Meerut", ["Meerut"]], ["Gorakhpur", ["Gorakhpur"]]],
  "Uttarakhand": [["Dehradun", ["Dehradun"]], ["Haridwar", ["Haridwar"]], ["Nainital", ["Haldwani", "Nainital"]], ["Udham Singh Nagar", ["Rudrapur"]]],
  "West Bengal": [["Kolkata", ["Kolkata"]], ["Howrah", ["Howrah"]], ["Darjeeling", ["Siliguri", "Darjeeling"]], ["Paschim Bardhaman", ["Asansol", "Durgapur"]], ["Nadia", ["Kalyani"]]],
  "Andaman and Nicobar Islands": [["South Andaman", ["Port Blair"]], ["Nicobar", ["Car Nicobar"]]],
  "Chandigarh": [["Chandigarh", ["Chandigarh"]]],
  "Dadra and Nagar Haveli and Daman and Diu": [["Dadra and Nagar Haveli", ["Silvassa"]], ["Daman", ["Daman"]], ["Diu", ["Diu"]]],
  "Delhi": [["New Delhi", ["New Delhi", "Delhi"]]],
  "Jammu and Kashmir": [["Srinagar", ["Srinagar"]], ["Jammu", ["Jammu"]], ["Anantnag", ["Anantnag"]], ["Baramulla", ["Baramulla"]]],
  "Ladakh": [["Leh", ["Leh"]], ["Kargil", ["Kargil"]]],
  "Lakshadweep": [["Lakshadweep", ["Kavaratti"]]],
  "Puducherry": [["Puducherry", ["Puducherry"]], ["Karaikal", ["Karaikal"]]],
};

const knownLocalities: Record<string, string[]> = {
  Bengaluru: ["Indiranagar", "Koramangala", "HSR Layout", "Whitefield", "Jayanagar", "Malleshwaram", "Hebbal", "BTM Layout"],
  Mysuru: ["Gokulam", "Jayalakshmipuram", "Kuvempunagar", "Saraswathipuram", "Vijayanagar"],
  Mumbai: ["Bandra West", "Andheri East", "Juhu", "Powai", "Borivali West", "Dadar"],
  Pune: ["Kothrud", "Viman Nagar", "Koregaon Park", "Baner", "Aundh", "Hinjawadi"],
  Chennai: ["T. Nagar", "Adyar", "Anna Nagar", "Mylapore", "Velachery", "Besant Nagar"],
  Hyderabad: ["Gachibowli", "Madhapur (Hitec City)", "Jubilee Hills", "Banjara Hills", "Kukatpally", "Secunderabad"],
};

export const LOCALITY_TREE: StateNode[] = Object.entries(locations).map(([name, districts]) => ({
  name,
  districts: districts.map(([district, cityNames]) => ({
    name: district,
    towns: cityNames.map((city) => ({ name: city, localities: knownLocalities[city] ?? [] })),
  })),
}));

export const TOWN_CENTROIDS: Record<string, [number, number]> = {
  Bengaluru: [12.9716, 77.5946], Mysuru: [12.2958, 76.6394], Mumbai: [19.076, 72.8777], Pune: [18.5204, 73.8567],
  Chennai: [13.0827, 80.2707], Coimbatore: [11.0168, 76.9558], Madurai: [9.9252, 78.1198],
  Tiruchirappalli: [10.7905, 78.7047], Salem: [11.6643, 78.146], Hyderabad: [17.385, 78.4867],
  Warangal: [17.9689, 79.5941], Karimnagar: [18.4386, 79.1288], Nizamabad: [18.6725, 78.0941],
  "New Delhi": [28.6139, 77.209], Delhi: [28.6139, 77.209], Visakhapatnam: [17.6868, 83.2185], Vijayawada: [16.5062, 80.648],
  Guwahati: [26.1445, 91.7362], Patna: [25.5941, 85.1376], Raipur: [21.2514, 81.6296], Ahmedabad: [23.0225, 72.5714],
  Guntur: [16.3067, 80.4365], Tirupati: [13.6288, 79.4192], Kurnool: [15.8281, 78.0373], Nellore: [14.4426, 79.9865], Itanagar: [27.0844, 93.6053], Bomdila: [27.2645, 92.4159], Tawang: [27.5861, 91.8594], Dibrugarh: [27.4728, 94.912], Silchar: [24.8333, 92.7789], Jorhat: [26.75, 94.2167], Tezpur: [26.6528, 92.7926], Gaya: [24.7914, 85.0002], Muzaffarpur: [26.1209, 85.3647], Bhagalpur: [25.2425, 86.9842], Darbhanga: [26.1542, 85.8918], Bhilai: [21.1938, 81.3509], Durg: [21.1904, 81.2849], Jagdalpur: [19.0748, 82.008], Panaji: [15.4909, 73.8278], Mapusa: [15.5915, 73.8089], Margao: [15.2832, 73.9862], Vasco: [15.386, 73.844], Surat: [21.1702, 72.8311], Vadodara: [22.3072, 73.1812], Rajkot: [22.3039, 70.8022], Gandhinagar: [23.2156, 72.6369], Bhavnagar: [21.7645, 72.1519], Faridabad: [28.4089, 77.3178], Hisar: [29.1492, 75.7217], Karnal: [29.6857, 76.9905], Panipat: [29.3909, 76.9635], Dharamshala: [32.219, 76.3234], Solan: [30.9045, 77.0967], Mandi: [31.708, 76.932], Jamshedpur: [22.8046, 86.2029], Dhanbad: [23.7957, 86.4304], Bokaro: [23.6693, 86.1511], Mangaluru: [12.9141, 74.856], Belagavi: [15.8497, 74.4977], Kalaburagi: [17.3297, 76.8343], Hubballi: [15.3647, 75.124], Dharwad: [15.4589, 75.0078], Shivamogga: [13.9299, 75.5681], Thiruvananthapuram: [8.5241, 76.9366], Kozhikode: [11.2588, 75.7804], Thrissur: [10.5276, 76.2144], Kollam: [8.8932, 76.6141], Kannur: [11.8745, 75.3704], Jabalpur: [23.1815, 79.9864], Gwalior: [26.2183, 78.1828], Ujjain: [23.1765, 75.7885], Nagpur: [21.1458, 79.0882], Nashik: [19.9975, 73.7898], Thane: [19.2183, 72.9781], Kolhapur: [16.705, 74.2433], Dimapur: [25.9091, 93.7266], Berhampur: [19.3149, 84.7941], Cuttack: [20.4625, 85.883], Sambalpur: [21.4669, 83.9812], Puri: [19.8135, 85.8312], Amritsar: [31.634, 74.8723], Jalandhar: [31.326, 75.5762], Patiala: [30.3398, 76.3869], Mohali: [30.7046, 76.7179], Jodhpur: [26.2389, 73.0243], Udaipur: [24.5854, 73.7125], Kota: [25.2138, 75.8648], Ajmer: [26.4499, 74.6399], Bikaner: [28.0229, 73.3119], Namchi: [27.1667, 88.3667], Khammam: [17.2473, 80.1514],
  Gurugram: [28.4595, 77.0266], Shimla: [31.1048, 77.1734], Ranchi: [23.3441, 85.3096], Kochi: [9.9312, 76.2673],
  Indore: [22.7196, 75.8577], Bhopal: [23.2599, 77.4126], Imphal: [24.817, 93.9368], Shillong: [25.5788, 91.8933],
  Aizawl: [23.7271, 92.7176], Kohima: [25.6751, 94.1086], Bhubaneswar: [20.2961, 85.8245], Ludhiana: [30.901, 75.8573],
  Jaipur: [26.9124, 75.7873], Gangtok: [27.3389, 88.6065], Agartala: [23.8315, 91.2868], Lucknow: [26.8467, 80.9462],
  Dehradun: [30.3165, 78.0322], Kolkata: [22.5726, 88.3639], Port: [11.6234, 92.7265], "Port Blair": [11.6234, 92.7265],
  Chandigarh: [30.7333, 76.7794], Silvassa: [20.2766, 73.0083], Srinagar: [34.0837, 74.7973], Leh: [34.1526, 77.5771],
  Kavaratti: [10.5667, 72.6417], Puducherry: [11.9416, 79.8083],
};

export function centroidFor(town: string): [number, number] {
  return TOWN_CENTROIDS[town] ?? [12.9716, 77.5946];
}
