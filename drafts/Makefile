
DOCS=	draft-ietf-opsawg-mud-18.txt \
	draft-ietf-opsawg-mud-18.xml \
	draft-ietf-opsawg-mud-18.html

all: $(DOCS)

%.xml:	%.mkd
	kramdown-rfc2629 $< > $@
%.html %.txt:	%.xml
	xml2rfc --html $<
	xml2rfc --text $<


