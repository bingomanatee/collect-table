# Carpenter

Carpenter is a full-fledged client side/javascript database. It is intended for use as a client side store, a la Redux,
hooks, etc. 

## But there are so many JS databases!

Yes -- BUT: most of them either 

* are wrappers for indexedDB 
* Don't include transactions
* Don't allow you to store ANY kind of structure (Map, Set, object, array)
* Don't allow deep nested queries
* Is not identity key-driven
* Is bound to a particular back-end API/store system

Why does this matter? 

Carpenter is designed to service the creation of business apps; having an app "choke" 2/3 through a series of inserts
is not a viable situation for a real time application. Transactions let you "reset" the data to the last healthy state
if an error is thrown, giving you full assurance that the app is stable. 

Carpenter is designed for full interoperability with any sort of structure you may need for your web application; 
so allowing only a subset of the kind of things that are present in application use is not acceptable. Want to store dom
objects in your DB? Fine, why not? (just don't try to join to them). Functions, symbols, whatever. 
Carpenter's emphasis is that all data is stored in flat lists and most of the work is done with records that *refer* to
the data by ID rather than storing local copies of it. 

Using Carpenter as a store means you don't have to free your client side store structure in a singular hierarchy. 
You can pull the related data ad hoc as you need it. You can even create on-the-fly join definitions to associate records
in a query as you like it. But when you do need to, you can pull data as deeply as you want.

As to being "backend agnostic" Carpenter doesn't assume there *is* one - you can use it for local state management
as well as for mirroring 

# Implementation

## Carpenter allows for ANY type of data

Carpenter makes zero assumptions about what your data is. Although "setField" methods will fail
on scalar data, all data is kept in a collection that simply stores it; you could for instance,
make a database of DOM elements, or functions, or React components. All data is kept in a (collect-wrapped)
Map; not only can your data be of any type you need, so can its keys.

Data is retrieved via an `RxJS` stream.

The apis will be fully documented in the near future. 

## FAIR WARNING: early alpha mode

A lot of APIs are changing rapidly - this is an early phase experiment. 
