/* This library is free software; you can redistribute it and/or
   modify it under the terms of the GNU Lesser General Public
   License as published by the Free Software Foundation; either
   version 3 of the License, or (at your option) any later version.

   This library is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
   Lesser General Public License for more details.

   You should have received a copy of the GNU Lesser General
   Public License along with this library; if not, write to the
   Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
   Boston, MA 02110-1301 USA */

$.griffinTableExtensions.globalHooks.rowsLoaded.push(function(){
    $('.griffin-table .table-edit').click(function(e) {
        e.preventDefault();
        griffinTableRowEdit.apply(this);
    });
    $('.griffin-table .table-delete').click(function(e) {
        e.preventDefault();
        griffinTableRowDelete.apply(this);
    });
});

function showEditorDialog($row, contents) {
    var dialog = $('<div></div>').appendTo('body');
    dialog.html(contents);
    var $form = $('form', dialog);
    
    dialog.dialog({
        title: 'Edit row',
        close: function(event, ui) {
            dialog.remove();
        },
        buttons: {
            "Save": function() {
                if (jQuery.validate && !$form.validate()) {
                    return false;
                }
                $.post($form.attr('action'), $form.serialize(), function(result) {
                    if (result.success) {
                        $row.closest('table').griffinTable('updateRow', result.content);
                        $( this ).dialog( "close" );
                    } else {
                        alert(result.errorMessage);
                    }
                });
                
            },
            Cancel: function() {
                $( this ).dialog( "close" );
            }
        },
        modal: true
    });        
}

function griffinTableRowEdit()
{
    var $row = $(this).closest('tr');
    var table = $(this).closest('table');
    var data = $row.data('griffin-table-data');
    
    var template = $('#' + $(table).attr('id') + '-edit-template');
    
    // use ajax to fetch the edit form
    if ($(this).hasClass('ajax')) {
        var overlay = $(table).griffinTable('overlay');
        $.ajax({
            url: $(this).attr('href'),
            context: document.body,
            success: function(){
                overlay.remove();
                showEditorDialog($row, data);
                return this;
            },
            error: function (){
                overlay.remove();
                alert('Failed to fetch data from server.');
            }
        });
        
        return this;
    // use a template to render the row
    } else if (template.length == 1) {
        var html = '';
        if (jQuery().render) {
             html = template.render(data);
        } else if (jQuery().tmpl) {
            $.template(template.attr('id'), template); //outerhtml: .clone().wrap('<div></div>').parent().html()
            html = $.tmpl(template.attr('id'), data);
        } else {
            alert('You have defined a template but either jsRender or jquery.tmpl could be found. Forgot to include a script?');
            return this;
        }
        
        
        var $html = $(html);
        var hasForm = false;
        $.each($html, function(index, item) {
            if ($('form', item).length === 1 || item.nodeName.toLowerCase() === 'form'){
                hasForm  = true;
                return false;
            }
        });
        if (!hasForm) {
            var form = $('<form method="POST" action="' + $(this).attr('href') + '"></form>');
            form.html(html);
            html = form;
        }
        showEditorDialog($row, html);
        return this;
    }
    
    var html = '<div class="griffin-table-form"><form method="POST" action="' + $(this).attr('href') + '">\r\n';
    $.each(data, function(name, value) {
        if (name.toLowerCase() === 'id') {
            html += '<input type="hidden" name="' + name + '" value="' + value + '" />';
        } else {
            html += '<div class="form-row"><label for="' + name + '">' + name + '</label><input type="text" name="' + name + '" value="' + value + '" /></div>';
        }
    });
    html += '</form></div>';
    showEditorDialog($row, html);
    return this;
}

function griffinTableRowDelete()
{
    var html = '';
    var table = $(this).closest('table');
    var data = $(this).closest('tr').data('griffin-table-data');

    var template = $('#' + $(table).attr('id') + '-delete-template');
    if (template.length == 1) {
        if (jQuery().render) {
             html = template.render(data);
        } else if (jQuery().tmpl) {
            $.template(template.attr('id'), template); //outerhtml: .clone().wrap('<div></div>').parent().html()
            var html = $.tmpl(template.attr('id'), data);
        } else {
            alert('You have defined a template but either jsRender or jquery.tmpl could be found. Forgot to include a script?');
            return this;
        }
    } else {
        html = '<div>Are you sure that you want to delete the selected row?</div>';
    }
    
    var $link = $(this);
    var dialog = $('<div></div>').appendTo('body');
    dialog.html(html);
    dialog.dialog({
        title: 'Delete row',
        close: function(event, ui) {
            dialog.remove();
        },
        buttons: {
            "Delete": function() {
                $.post($link.attr('href'), function(result) {
                    if (result.success) {
                        $row.closest('table').griffinTable('update');
                        $( this ).dialog( "close" );
                    } else {
                        alert(result.errorMessage);
                    }
                });
                
            },
            Cancel: function() {
                $( this ).dialog( "close" );
            }
        },
        modal: true
    });
    
    return this;
}