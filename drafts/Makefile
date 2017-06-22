
DOCS=	draft-ietf-opsawg-mud-07.txt \
	draft-ietf-opsawg-mud-07.html

all: $(DOCS)

%.xml:	%.mkd
	kramdown-rfc2629 $< > $@
%.html %.txt:	%.xml
	xml2rfc --html $<
	xml2rfc --text $<


