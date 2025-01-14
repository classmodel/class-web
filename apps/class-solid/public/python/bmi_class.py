# class BmiClass:
#     def __init__(self):
#         self.config = {}
#         self.model = None
#         print("CLASS instantiated!")

#     def initialize(self, config: dict):
#         # from class_model import CLASS

#         self.config = config
#         self.model = CLASS(config)
#         print("CLASS initialized!")

#     def update(self):
#         self.model.update()

#     def get_component_name(self):
#         return "Chemistry Land-surface Atmosphere Soil Slab model"

#     def get_output_item_count(self):
#         return len(self.get_output_var_names())

#     def get_output_var_names(self):
#         return ["h", "theta", "dtheta", "q", "dq"]

#     def get_var_grid(self, name: str):
#         return 1

#     def get_var_type(self, name: str):
#         return "float"

#     def get_var_location(self, name: str):
#         return "node"

#     def get_current_time(self):
#         return self.model.t

#     def get_end_time(self):
#         return self.config["timeControl"]["runtime"]

#     def get_time_units(self):
#         return "s"

#     def get_time_step(self):
#         return self.config["timeControl"]["dt"]

#     def get_value(self, name: str):
#         if name in self.get_output_var_names():
#             return [getattr(self.model, name)]
#         raise ValueError(f"Variable {name} not found")

#     def get_grid_type(self):
#         return "scalar"

#     def run(self, freq=600, var_names=None):
#         if var_names is None:
#             var_names = self.get_output_var_names()

#         output = {"t": []}
#         for name in var_names:
#             output[name] = []

#         while self.model.t <= self.config["timeControl"]["runtime"]:
#             if self.model.t % freq == 0:
#                 output["t"].append(self.model.t)
#                 for name in var_names:
#                     output[name].append(getattr(self.model, name))
#             self.update()

#         return output

class SubClass:
    def __init__(self):
        self.value = 42

class BmiClass:
    def __init__(self):
        print("BmiClass in python instantiated")
        self.model = None

    def get_component_name(self):
        return "Chemistry Land-surface Atmosphere Soil Slab model"

    def initialize(self, cfg: dict):
        # Instantiate another class (SubClass) here
        self.model = SubClass()

    def get_value(self, var: str):
        return self.model.value

    def get_output_var_names(self):
        return ["h", "theta", "dtheta", "q", "dq"]

    def run(self, var_names=["t"]):
        output = {"t": []}
        return output