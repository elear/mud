
DOCS=	draft-lear-opsawg-mud-bw-profile.txt \
	draft-lear-opsawg-mud-bw-profile.xml \
	draft-lear-opsawg-mud-bw-profile.html

all: $(DOCS)

%.xml:	%.mkd
	kramdown-rfc2629 $< > $@
%.html %.txt:	%.xml
	xml2rfc --html $<
	xml2rfc --text $<


