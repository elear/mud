
DOCS=	draft-ietf-opsawg-mud-09.txt \
	draft-ietf-opsawg-mud-09.xml \
	draft-ietf-opsawg-mud-09.html

all: $(DOCS)

%.xml:	%.mkd
	kramdown-rfc2629 $< > $@
%.html %.txt:	%.xml
	xml2rfc --html $<
	xml2rfc --text $<


