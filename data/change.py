import json


tcc_data = open("tcc.json")
code_data = open("codes.json")

tccs = json.load(tcc_data)
codes = json.load(code_data)
output = []

for date in tccs:
	for contributor in date["contributions"]:
		for country in codes:
			print country
			# if contributor == country["name"]:
			# 	output[""]
			# 	contributor = country["iso3alpha"]

				


# for date in tccs:
# 	print date
# for country in codes:
# 	print country["iso3alpha"]