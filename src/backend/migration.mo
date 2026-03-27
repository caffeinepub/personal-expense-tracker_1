import Map "mo:core/Map";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Text "mo:core/Text";

module {
  type Expense = {
    id : Text;
    amount : Float;
    categoryId : Text;
    date : Text;
    note : Text;
    paymentMethod : Text;
    createdAt : Int;
  };

  type CategoryInternal = {
    id : Text;
    name : Text;
    color : Text;
    budget : Float;
    createdAt : Int;
  };

  type MonthlyIncome = {
    month : Text;
    amount : Float;
  };

  type AppSettings = {
    currency : Text;
    updatedAt : Int;
  };

  type ShoppingItem = {
    id : Text;
    name : Text;
    category : Text;
    estimatedPrice : ?Float;
    bought : Bool;
    createdAt : Int;
    date : ?Text;
  };

  type OldUserData = {
    var expenses : Map.Map<Text, Expense>;
    var categories : Map.Map<Text, CategoryInternal>;
    var monthlyIncome : Map.Map<Text, MonthlyIncome>;
    var settings : ?AppSettings;
    var initialized : Bool;
  };

  type NewUserData = {
    var expenses : Map.Map<Text, Expense>;
    var categories : Map.Map<Text, CategoryInternal>;
    var monthlyIncome : Map.Map<Text, MonthlyIncome>;
    var shoppingItems : Map.Map<Text, ShoppingItem>;
    var settings : ?AppSettings;
    var initialized : Bool;
  };

  type OldActor = {
    userData : Map.Map<Principal, OldUserData>;
  };

  type NewActor = {
    userData : Map.Map<Principal, NewUserData>;
  };

  public func run(old : OldActor) : NewActor {
    let newUserDataEntries = old.userData.entries().map(
      func((principal, oldUserData)) {
        (principal, toNewUserData(oldUserData));
      }
    );
    let newUserDataMap = Map.fromIter<Principal, NewUserData>(newUserDataEntries);
    { userData = newUserDataMap };
  };

  func toNewUserData(old : OldUserData) : NewUserData {
    {
      var expenses = old.expenses;
      var categories = old.categories;
      var monthlyIncome = old.monthlyIncome;
      var shoppingItems = Map.empty<Text, ShoppingItem>();
      var settings = old.settings;
      var initialized = old.initialized;
    };
  };
};
