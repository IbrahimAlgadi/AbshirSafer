const colorTextMapping = {
    'red': 'white',
    'yellow': 'black',
    'green': 'white',
    'blue': 'white',
    'grey': 'black',
}

const bgColorMapping = {
    'red': 'bg-danger',
    'yellow': 'bg-warning',
    'green': 'bg-success',
    'blue': 'bg-primary',
    'grey': 'bg-gray',
    'default': 'bg-theme'
}

const vehicleLegalStatusMapping = {
    "1": {color: "red", ar_message: "مركبة مطلوبة", en_message: "Wanted Vehicle"},
    "2": {color: "yellow", ar_message: "مركبة موقوفة", en_message: "Vehicle Suspended"},
    "3": {color: "yellow", ar_message: "مركبة محجوزة", en_message: "Vehicle Pawned"},
    "4": {color: "green", ar_message: "مركبة مستأجرة", en_message: "Rented Vehicle"},
    "5": {color: "green", ar_message: "مركبة معارة", en_message: "Vehicle on Loan"},
    "6": {color: "red", ar_message: "لوحة مسروقة", en_message: "Stolen Plate"},
    "7": {color: "yellow", ar_message: "لوحة مفقودة", en_message: "Missing Plate"},
    "8": {color: "red", ar_message: "مركبة مسروقة", en_message: "Stolen Vehicle"},
    "9": {color: "red", ar_message: "لوحة مسروقة بالخارج", en_message: "Stolen Plate Outside Kingdom"},
    "10": {color: "red", ar_message: "تحجز مطلوبة بسبب الملكية", en_message: "Wanted Suspend Ownership"},
    "11": {color: "red", ar_message: "مركبة مسروقه بالخارج", en_message: "Stolen Vehicle Outside Kingdom"},
    "12": {color: "red", ar_message: "لوحة مفقودة بالخارج", en_message: "Missing Plate Outside Kingdom"},
    "13": {color: "red", ar_message: "مسروقة", en_message: "Stolen"},
    "14": {color: "yellow", ar_message: "تالفة", en_message: "Damaged"},
    "15": {color: "red", ar_message: "مطلوبة", en_message: "Wanted"},
    "16": {color: "red", ar_message: "موقوفة", en_message: "Suspended"},
    "17": {color: "yellow", ar_message: "مفقودة", en_message: "Missing"},
    "18": {color: "yellow", ar_message: "محطمة", en_message: "Shattered"},
    "19": {color: "yellow", ar_message: "محروقة", en_message: "Burned"},
    "20": {color: "yellow", ar_message: "لوحة", en_message: "Plate"},
    "21": {color: "yellow", ar_message: "رخصة سير منتهية", en_message: "Expired Vehicle Registration"},
};

const authorizationMapping = {
    "1": {color: "green", ar_message: "مصرح", en_message: "Authorized"},
    "2": {color: "red", ar_message: "غير مصرح", en_message: "Unauthorized"},
};

const employeeTypeMapping = {
    "1": {ar_message: "موظف", en_message: "Employee"},
    "2": {ar_message: "موظف متعاقد", en_message: "Contractor"},
    "3": {ar_message: "زائر", en_message: "Visitor"},
};

const vehicleWantedStatusMapping = {
    "1": {color: "green", textColor: 'white', message: "Normal or Legal Vehicle"},
    "2": {color: "yellow", textColor: 'black', message: "Suspected Vehicle"},
    "3": {color: "red", textColor: 'black', message: "Wanted Vehicle"},
    "4": {color: "blue", textColor: 'white', message: "Undefined"},
};

const plateTypeCodeMapping = {
    "1": {en_message: "Private Car", ar_message: "خصوصي", code: 1, color: "White"},
    "2": {en_message: "Public Transport", ar_message: "نقل عام", code: 2, color: "yellow"},
    "3": {en_message: "Private Transport", ar_message: "نقل خاص", code: 3, color: "Blue"},
    "4": {en_message: "Public Bus", ar_message: "حافلة صغيرة عامة", code: 2, color: "yellow"},
    "5": {en_message: "Private Bus", ar_message: "حافلة صغيرة خاصة", code: 3, color: "Blue"},
    "6": {en_message: "Taxi", ar_message: "أجرة", code: 2, color: "yellow"},
    "7": {en_message: "Equipment", ar_message: "معدات ثقيلة", code: 3, color: "Blue"},
    "8": {en_message: "Export", ar_message: "تصدير", code: 8, color: "Gray"},
    "9": {en_message: "Diplomatic", ar_message: "دبلوماسي", code: 9, color: "green"},
    "10": {en_message: "Temporary", ar_message: "مؤقت", code: 8, color: "Gray"},
};

const errorCodesMapping = {
    "000": "Successful request",
    "001": "Plate information is incorrect",
    "002": "Account information is incorrect",
    "003": "Account is inactive",
    "004": "Parameters are not all available",
    "005": "Parameters formats are incorrect",
    "100": "An Error Occurred while processing your request. Please try again later.",
    "006": "Contact ELM help desk with details",
    "007": "Permit doesn’t exist",
    "008": "Permit has been added",
    "009": "Permit details have been updated",
    "010": "Permit status has been updated"
};
