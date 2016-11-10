#!/usr/bin/python

##-->>>>>>>>>>>>>$ CISCO MUD SERVER YANG FILE EXTRACTION PYTHON CODE $<<<<<<<<<<<<<<--##
##-->>>>>>$ mud_controller.py python code to extract the ACL name and DACL content from MUD server$<<<<<<<--##
##-->>>>>>$ MUD file reference https://www.ofcourseimright.com/mudmaker/ $<<<<<<<<<--##

from urllib2 import urlopen, URLError, HTTPError
from subprocess import call
import sys
import os
import json
import glob

dir_input = "/usr/local/etc/controller/"
mud_file_store = dir_input+'mud.json'
CA = dir_input+'ck.pem'

def dlfile(device_json, device_ps7):
    # Open the url
    # device_json for json file form mudserver
    # device_ps7 for getting signed signature
    try:
        f1 = urlopen(device_json)
	device_name = device_json.split("mud/",1)[1]
        if device_name.endswith(".json"):
		device_json_path = dir_input+device_name
		# writing json file
                with open(device_json_path, "wb") as local_file:
                     local_file.write(f1.read())
		device_name_ps7_format = device_json.split("mud/",1)[1]
                device_name_ps7_format = os.path.splitext(device_name_ps7_format)[0]
                device_name_ps7 = dir_input+device_name_ps7_format+".p7s"
		f2 = urlopen(device_ps7)
        	# writing signature file
        	with open(device_name_ps7, "wb") as local_file:
            		local_file.write(f2.read())

	else:
	        device_json_path = dir_input+device_name
		device_json_format = device_json.split("mud/",1)[1]+".json"
		# writing json file
                with open(device_json_path, "wb") as local_file:
                     local_file.write(f1.read())
        	f2 = urlopen(device_ps7)
        	device_name_ps7_format = device_ps7.split("mud/",1)[1][:-1]
        	device_name_ps7 = dir_input+device_name_ps7_format
        	# writing signature file
        	with open(device_name_ps7, "wb") as local_file:
            		local_file.write(f2.read())
        # calling openssl command
        decrypted = call(['openssl', 'cms', '-verify', '-in', device_name_ps7, '-CAfile', CA, '-out', mud_file_store, '-inform', 'DER', '-content', device_json_path])
        #delete(device_name) # remove old download files
    #handle errors
    except HTTPError, e:
        print "HTTP Error:", e.code, device_json, device_ps7
    except URLError, e:
        print "URL Error:", e.reason, device_json, device_ps7

def delete(device_name_del):
	filename = device_name_del
	search_trace = [filename+'.p7s', filename+'.json']
	file_list = []
	for root, dirs, files in os.walk(dir_input):
		for trace in search_trace:
			search_trace_path = os.path.join(root, trace)
			for filename in glob.glob(search_trace_path):
				if os.path.exists(filename):
					file_list.append(filename)
				else:
					print 'No files path found +name'
	for device_file in file_list:
			os.remove(device_file)
        
def radius():
    if (str(sys.argv[2]) == "W"):
        device_url = str(sys.argv[1])# print url
        device_json = device_url
	if device_json.endswith(".json"):
	        device_url_ps7 = device_url
		device_url_ps7 = device_url_ps7.split(".json",1)[0]
		device_name_ps7 = device_url_ps7.split("mud/",1)[1]
                device_name_ps7_format = os.path.splitext(device_name_ps7)[0]
                device_ps7 = device_url_ps7+".p7s"
                print device_ps7

	else: 
		device_ps7 = device_url+".p7s/"
        dlfile(device_json, device_ps7)

def get_json_value(json_object, index):
    try:
        with open(mud_file_store, 'r') as f:
             data = f.read()
    except IOError:
            print 'cannot open file to read', mud_file_store
    else:
        data = json.loads(data)
    in_acl = (data['ietf-acl:access-lists']['ietf-acl:access-list'][0]['access-list-entries']['ace'])
    len_in_acl = len(data['ietf-acl:access-lists']['ietf-acl:access-list'][0]['access-list-entries']['ace'])
    out_acl = (data['ietf-acl:access-lists']['ietf-acl:access-list'][1]['access-list-entries']['ace'])
    len_out_acl = len(data['ietf-acl:access-lists']['ietf-acl:access-list'][1]['access-list-entries']['ace'])
    last_update = data['ietf-mud:meta-info']['lastUpdate']
    cache_validity = data['ietf-mud:meta-info']['cacheValidity']
    new_list = []
    for row in in_acl:
        try:
            if json_object == "acl_name_in":
                mylist = ((data['ietf-acl:access-lists']['ietf-acl:access-list'][0]['acl-name']))
                new_list += [mylist]
	    if json_object == "acl_type_in":
                mylist = ((data['ietf-acl:access-lists']['ietf-acl:access-list'][0]['ietf-mud:packet-direction']))
                new_list += [mylist]
	    if json_object == "rule_name_in":
                mylist = ((row['rule-name']))
                new_list += [mylist]
            if json_object == "src_dnsname_in":
                mylist = ((row['matches']['ietf-acldns:src-dnsname']))
                new_list += [mylist]
            if json_object == "src_protocol_in":
                mylist = ((row['matches']['protocol']))
                new_list += [mylist]
            if json_object == "src_lower_port_in":
                mylist = ((row['matches']['source-port-range']['lower-port']))
                new_list += [mylist]
            if json_object == "src_upper_port_in":
                mylist = ((row['matches']['source-port-range']['upper-port']))
                new_list += [mylist]
            if json_object == "src_actions_in":
                mylist = ((row['actions']['permit'][0]))
                new_list += [mylist]
        except KeyError: 
            pass
    for row in out_acl:
        try:
	    if json_object == "acl_name_out":
                mylist = ((data['ietf-acl:access-lists']['ietf-acl:access-list'][1]['acl-name']))
                new_list += [mylist]
            if json_object == "acl_type_out":
                mylist = ((data['ietf-acl:access-lists']['ietf-acl:access-list'][1]['ietf-mud:packet-direction']))
                new_list += [mylist]
            if json_object == "rule_name_out":
                mylist = ((row['rule-name']))
                new_list += [mylist]
            if json_object == "src_dnsname_out":
                mylist = ((row['matches']['ietf-acldns:src-dnsname']))
                new_list += [mylist]
            if json_object == "src_protocol_out":
                mylist = ((row['matches']['protocol']))
                new_list += [mylist]
            if json_object == "src_lower_port_out":
                mylist = ((row['matches']['source-port-range']['lower-port']))
                new_list += [mylist]
            if json_object == "src_upper_port_out":
                mylist = ((row['matches']['source-port-range']['upper-port']))
                new_list += [mylist]
            if json_object == "src_actions_out":
                mylist = ((row['actions']['permit'][0]))
                new_list += [mylist]
        except KeyError: 
            pass
    
    if index < len_in_acl:
        try:
            return new_list[index]
        except ValueError:
            print ""
            
def read_json():
	# In_ACL
	acl_name_in = get_json_value("acl_name_in",0)
	acl_type_in = get_json_value("acl_type_in",0)
	rule_name_in = get_json_value("rule_name_in",0)
	src_dnsname_in = get_json_value("src_dnsname_in",0)
	src_protocol_in = get_json_value("src_protocol_in",0)
	src_lower_port_in = get_json_value("src_lower_port_in",0)
	src_upper_port_in = get_json_value("src_upper_port_in",0)
	src_actions_in = get_json_value("src_actions_in",0)
	# Out_ACL
        acl_name_out = get_json_value("acl_name_out",0)
        acl_type_out = get_json_value("acl_type_out",0)
	rule_name_out = get_json_value("rule_name_out",0)
	src_dnsname_out = get_json_value("src_dnsname_out",0)
	src_protocol_out = get_json_value("src_protocol_out",0)
	src_lower_port_out = get_json_value("src_lower_port_out",0)
	src_upper_port_out = get_json_value("src_upper_port_out",0)
	src_actions_out = get_json_value("src_actions_out",0)
	
	def dacl_ip_in():
            if (src_dnsname_in == "attacker"): #dnsname to ip
                ip_address_in = "172.19.155.54"
                return ip_address_in
            elif(src_dnsname_in == "bldmng"): #dnsname to ip
                ip_address_in = "172.19.155.146"
                return ip_address_in
            src_dnsname_in = dacl_ip_in()
        
        def dacl_ip_out():
            if 	(src_dnsname_out == "attacker"): #dnsname to ip
                ip_address_out = "172.19.155.54"
                return ip_address_out
            elif(src_dnsname_out == "bldmng"):
                ip_address_out = "172.19.155.146"
                return ip_address_out
            src_dnsname_out = dacl_ip_out()

	# permit udp host 172.19.155.106 any eq 5000
        # Egress Point
	# Out_ACL 
	def egress_acl_1(): #Read from file to create ACL formate
		print src_actions_out# permit / deny
		print src_protocol_out# protocol
		print "host"#per user ACL src = any
		print src_dnsname_out# destination
		if (src_lower_port_out == ""):
				print "any eq"#port match any
				print src_upper_port_out
		else:   
				print "any range"#port match any
				print src_lower_port_out
				print src_upper_port_out
	# Ingress Point        
	#'permit ip any host 172.19.155.106'
	# IN_ACL
	def ingress_acl_1(): #Read from file to create ACL formate
		print src_actions_in #permit / deny
		print src_protocol_in #protocol
		print "any host" #per user ACL src = any
		print src_dnsname_in #destination
		if (src_lower_port_in == ""):
				print "eq" #port match any
				print src_upper_port_in
		else:
				print "range" #port match any
				print src_lower_port_in
				print src_upper_port_in
	def egress_acl_permit():
			print "permit ip any any"
	def egress_acl_deny():
			print "deny ip any any"
	def egress_acl_null():
			print ''## 
	if (str(sys.argv[2]) == "R1"):
		if (src_upper_port_in == '0'):
				egress_acl_permit()#"permit ip any any"
		else:
				ingress_acl_1()
	elif(str(sys.argv[2]) == "R2"):
		if (src_upper_port_out == '0'):
				egress_acl_permit()#"permit ip any any"
		else :
				egress_acl_1();
	elif(str(sys.argv[2]) == "R3"):
		if (src_upper_port_out == '0'):
				print ''#"permit ip any any"
		else :
				egress_acl_deny();
	#Get only USER NAMER fro DACL to verify second request from SWITCH after access - accept
	if (str(sys.argv[2]) == "U1"): #Read from file to send DACL user name for ingress
			print acl_name_in #DACL name with crypto key

	if (str(sys.argv[2]) == "U2"): #Read from file to send DACL user name for egrees
			print acl_name_out# DACL name with crypto key

if __name__ == '__main__':
	if len(sys.argv) > 1:
		a = str(sys.argv[1]) # Access through
	else :
		a = "null"
	radius()# call json and signature verify program 
	read_json() # send the request