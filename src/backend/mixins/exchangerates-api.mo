import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Types "../types/exchangerates";

mixin (userExchangeRates : Map.Map<Principal, Map.Map<Text, Types.ExchangeRateEntry>>) {
  public shared ({ caller }) func saveExchangeRates(rates : [Types.ExchangeRateEntry]) : async Result<(), Text> {
    Runtime.trap("not implemented");
  };

  public query ({ caller }) func getExchangeRates() : async [Types.ExchangeRateEntry] {
    Runtime.trap("not implemented");
  };
};
