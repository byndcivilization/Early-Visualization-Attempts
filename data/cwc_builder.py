# -*- coding: utf-8 -*-
import json
import wbdata
import lxml
from datetime import date
from urllib2 import urlopen
from datetime import date
from lxml import etree

import csv

current_year = date.today().year
last_year = date.today().year - 1
last_available_pop = current_year-3
code_data = open("codes.json")
cpi_target = "http://cpi.transparency.org/xml/cpi" + str(last_year) + "/cpi-" + str(last_year) + "-data.xml"
codes = json.load(code_data)


# Set up JSON object fo CWC data with WB API refs and URL for TI data
indicators = json.load(open("cwc_builder.json"))

# Convenience functions

def cut(perc, cutoff):
	if (perc > cutoff):
		return 1
	else:
		return 0

def reds(source, codes, dest,iso3=0):
	for x in source:
		if source[x][2] == 1:
			if iso3==0:
				for code in codes:
					if x==code["iso2alpha"]:
						dest.append((code["iso3alpha"],source[x][0],source[x][1]))
			else:
				dest.append((x,source[x][0],source[x][1]))

def most_recent(raw_input,dest,cutoff,less_than=0):
	temp_obj = {}

	for entry in raw_input:
		if entry["date"]==str(current_year-1):
			temp_obj[entry["country"]["id"]] = []

	for f in range(current_year,current_year-6,-1):
		date = str(f)
		for entry in raw_input:
			if entry["date"]==date:
				if entry["value"]==None:
					temp_obj[entry["country"]["id"]].append((date,"No Data",0))
				else:
					if less_than==0:
						perc = float(str(entry["value"]))/100
					else:
						perc = 1 - (float(str(entry["value"]))/100)
					red = cut(perc,cutoff)
					temp_obj[entry["country"]["id"]].append((date,perc,red))

	for country in temp_obj:
		if temp_obj[country][0][1] != "No Data":
			dest[country] = temp_obj[country][0]
		elif temp_obj[country][1][1] != "No Data":
			dest[country] = temp_obj[country][1]
		elif temp_obj[country][2][1] != "No Data":
			dest[country] = temp_obj[country][2]
		elif temp_obj[country][3][1] != "No Data":
			dest[country] = temp_obj[country][3]
		elif temp_obj[country][4][1] != "No Data":
			dest[country] = temp_obj[country][4]
		###Extend years
# 	# elif temp_obj[country][5][1] != "No Data":
# 	# 	dest[country] = temp_obj[country][5]
# 	# elif temp_obj[country][6][1] != "No Data":
# 	# 	dest[country] = temp_obj[country][6]
# 	# elif temp_obj[country][7][1] != "No Data":
# 	# 	dest[country] = temp_obj[country][7]
# 	# elif temp_obj[country][8][1] != "No Data":
# 	# 	dest[country] = temp_obj[country][8]
# 	# elif temp_obj[country][9][1] != "No Data":
# 	# 	dest[country] = temp_obj[country][9]
# 	# elif temp_obj[country][10][1] != "No Data":
# 	# 	dest[country] = temp_obj[country][10]
# 	# elif temp_obj[country][11][1] != "No Data":
# 	# 	dest[country] = temp_obj[country][11]

####################
###YOUTH BULGE CALCS
####################
pop_obj = {"BAR.POP.15UP":{},"BAR.POP.1519":{},"BAR.POP.2024":{},"BAR.POP.2529":{}}
pop_raw = [wbdata.get_data(indicators["youth"]["ref_15_plus"]),wbdata.get_data(indicators["youth"]["ref_15_19"]),wbdata.get_data(indicators["youth"]["ref_20_24"]),wbdata.get_data(indicators["youth"]["ref_25_29"])]

for each in pop_raw:
	cat = each[0]["indicator"]["id"]
	for entry in each:
		if entry["date"]==str(last_available_pop):
			country = entry["country"]["id"]
			if entry["value"] == None:
				pass
			else:
				value = float(entry["value"])
				pop_obj[cat][country] = (entry["date"],value)

# Derive youth bulge and add to indicators dict
for adult_key, adult_value in pop_obj["BAR.POP.15UP"].iteritems():
	for fifteen_key, fifteen_value in pop_obj["BAR.POP.1519"].iteritems():
		if adult_key==fifteen_key:
			for twenty_key, twenty_value in pop_obj["BAR.POP.2024"].iteritems():
				if adult_key==twenty_key:
					for twentyfive_key, twentyfive_value in pop_obj["BAR.POP.2529"].iteritems():
						if adult_key==twentyfive_key:
							perc = (fifteen_value[1]+twenty_value[1]+twentyfive_value[1])/adult_value[1]
							indicators["youth"]["bulge"][adult_key] = (last_available_pop,perc,cut(perc,.5))

# Create reds sublist
reds(indicators["youth"]["bulge"],codes,indicators["youth"]["reds"])

##################
###WB CALCULATIONS
##################
poverty_raw = wbdata.get_data(indicators["poverty"]["ref"])
inequality_raw = wbdata.get_data(indicators["inequality"]["ref"])
education_raw = wbdata.get_data(indicators["education"]["ref"])
health_raw = wbdata.get_data(indicators["health"]["ref"])
nutrition_raw = wbdata.get_data(indicators["nutrition"]["ref"])
water_raw = wbdata.get_data(indicators["water"]["ref"])

# iterate down the years to fill in values
most_recent(poverty_raw,indicators["poverty"]["pov"],.4)
most_recent(inequality_raw,indicators["inequality"]["gini"],.45)
most_recent(education_raw,indicators["education"]["lit"],.3,1)
most_recent(health_raw,indicators["health"]["dpt"],.3,1)
most_recent(nutrition_raw,indicators["nutrition"]["hunger"],.3)
most_recent(water_raw,indicators["water"]["improved"],.3,1)

# Find red values
reds(indicators["poverty"]["pov"],codes,indicators["poverty"]["reds"])
reds(indicators["inequality"]["gini"],codes,indicators["inequality"]["reds"])
reds(indicators["education"]["lit"],codes,indicators["education"]["reds"])
reds(indicators["health"]["dpt"],codes,indicators["health"]["reds"])
reds(indicators["nutrition"]["hunger"],codes,indicators["nutrition"]["reds"])
reds(indicators["water"]["improved"],codes,indicators["water"]["reds"])

############
###CPI CALCS -- Rank, Country, Score   
############
cpi_raw = urlopen(cpi_target).read()
cpi_root = lxml.etree.fromstring(cpi_raw)
cpi_data = {}

for row in cpi_root:
	cells = []
	if row.tag!="page" and row.tag!="total":
		for cell in row:
			cells.append(cell.text)
		country = cells[1]
		cpi_data[country] = cells[2]

for country in cpi_data:
	perc = 1 - float(cpi_data[country])/100
	red = cut(perc,.75)
	for code in codes:
		if country==code["name"]:
			indicators["corruption"]["cpi"][code["iso3alpha"]] = (last_year,cpi_data[country],red)


reds(indicators["corruption"]["cpi"],codes,indicators["corruption"]["reds"],iso3=1)

#####################
###WRITE DATA TO FILE
#####################
with open('../indicators.json','w') as outfile:
	json.dump(indicators,outfile)
