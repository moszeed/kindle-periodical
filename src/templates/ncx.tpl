<?xml version='1.0' encoding='utf-8'?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns:mbp="http://mobipocket.com/ns/mbp" xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="en-US">
  <head>
    <meta content="Template" name="dtb:uid"/>
    <meta content="2" name="dtb:depth"/>
    <meta content="0" name="dtb:totalPageCount"/>
    <meta content="0" name="dtb:maxPageNumber"/>
  </head>
  <docTitle>
    <text><%= title %></text>
  </docTitle>
  <docAuthor>
    <text><%= author %></text>
  </docAuthor>
  <navMap>
    <navPoint playOrder="0" class="periodical" id="periodical">
      <mbp:meta-img src="masthead.gif" name="mastheadImage"/>
      <navLabel><text>Table of Contents</text></navLabel>
      <content src="contents.html"/>
      <%= sections %>
    </navPoint>
  </navMap>
</ncx>
