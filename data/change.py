import json


tcc_data = open("tcc.json")
code_data = open("codes.json")

tccs = json.load(tcc_data)
codes = json.load(code_data)
output = []

# print len(tccs)
for i in range(0,len(tccs),1):
	output.append({"date":str(tccs[i]["date"]),"countries":{}})
	for contributor in tccs[i]["countries"]:
		for code in codes:
			if contributor == code["name"]:
				output[i]["countries"][str(code["iso3alpha"])] = tccs[i]["countries"][contributor]

with open('test.json','w') as outfile:
	json.dump(output,outfile)