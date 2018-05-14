<?xml version='1.0' encoding='utf-8'?>
    <package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="<%= doc_uuid %>">

        <metadata>
            <dc-metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
                <dc:title><%= title %></dc:title>
                <dc:language><%= language %></dc:language>
                <dc:creator><%= author %></dc:creator>
                <dc:publisher><%= publisher %></dc:publisher>
                <dc:subject><%= subject %></dc:subject>
                <dc:date><%= date %></dc:date>
                <dc:description><%= description %></dc:description>
            </dc-metadata>

            <x-metadata>
                <output content-type="application/x-mobipocket-subscription-magazine" encoding="utf-8"/>
                <% if(cover) { %><EmbeddedCover><%= cover %></EmbeddedCover><% } %>
            </x-metadata>

            <meta content="book-cover-image" name="cover"/>
        </metadata>

        <manifest>
            <item href="contents.html" media-type="application/xhtml+xml" id="contents"/>
            <item href="nav-contents.ncx" media-type="application/x-dtbncx+xml" id="nav-contents"/>
            <% if(cover) { %><item href="<%= cover %>" media-type="image/jpg" id="book-cover-image" /><% } %>
            <%= manifest_items %>
        </manifest>

        <spine toc="nav-contents">
            <itemref idref="contents"/>
            <%= spine_items %>
        </spine>

        <guide>
            <reference href="contents.html" type="toc" title="Table of Contents"/>
        </guide>

    </package>
</xml>
