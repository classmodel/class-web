# Constants
RHO = 1.2  # Density of air [kg m-3]
CP = 1005.0  # Specific heat of dry air [J kg-1 K-1]


class CLASS:
    """
    CLASS model definition.

    Attributes:
        _cfg: Object containing the model settings.
        h: ABL height [m].
        theta: Mixed-layer potential temperature [K].
        dtheta: Temperature jump at h [K].
        q: Mixed-layer specific humidity [kg kg-1].
        dq: Specific humidity jump at h [kg kg-1].
        t: Model time [s].
    """

    def __init__(self, config: dict):
        """
        Create object and initialize the model state.

        Args:
            config: Model settings as a dictionary.
        """
        self._cfg = config
        self.h = config["initialState"]["h_0"]
        self.theta = config["initialState"]["theta_0"]
        self.dtheta = config["initialState"]["dtheta_0"]
        self.q = config["initialState"]["q_0"]
        self.dq = config["initialState"]["dq_0"]
        self.t = 0

    def update(self):
        """Integrate mixed layer."""
        dt = self._cfg["timeControl"]["dt"]
        self.h += dt * self.htend
        self.theta += dt * self.thetatend
        self.dtheta += dt * self.dthetatend
        self.q += dt * self.qtend
        self.dq += dt * self.dqtend
        self.t += dt

    @property
    def htend(self) -> float:
        """Tendency of CLB [m s-1]."""
        return self.we + self.ws

    @property
    def thetatend(self) -> float:
        """Tendency of mixed-layer potential temperature [K s-1]."""
        return (self._cfg["mixedLayer"]["wtheta"] - self.wthetae) / self.h + self._cfg[
            "mixedLayer"
        ]["advtheta"]

    @property
    def dthetatend(self) -> float:
        """Tendency of potential temperature jump at h [K s-1]."""
        w_th_ft = 0.0  # TODO: add free troposphere switch
        return (
            self._cfg["mixedLayer"]["gammatheta"] * self.we - self.thetatend + w_th_ft
        )

    @property
    def qtend(self) -> float:
        """Tendency of mixed-layer specific humidity [kg kg-1 s-1]."""
        return (self._cfg["mixedLayer"]["wq"] - self.wqe) / self.h + self._cfg[
            "mixedLayer"
        ]["advq"]

    @property
    def dqtend(self) -> float:
        """Tendency of specific humidity jump at h [kg kg-1 s-1]."""
        w_q_ft = 0  # TODO: add free troposphere switch
        return self._cfg["mixedLayer"]["gammaq"] * self.we - self.qtend + w_q_ft

    @property
    def we(self) -> float:
        """Entrainment velocity [m s-1]."""
        we = -self.wthetave / self.dthetav

        # Don't allow boundary layer shrinking
        return max(we, 0)

    @property
    def ws(self) -> float:
        """Large-scale vertical velocity [m s-1]."""
        return -self._cfg["mixedLayer"]["divU"] * self.h

    @property
    def wthetae(self) -> float:
        """Entrainment kinematic heat flux [K m s-1]."""
        return -self.we * self.dtheta

    @property
    def wqe(self) -> float:
        """Entrainment moisture flux [kg kg-1 m s-1]."""
        return -self.we * self.dq

    @property
    def wthetave(self) -> float:
        """Entrainment kinematic virtual heat flux [K m s-1]."""
        return -self._cfg["mixedLayer"]["beta"] * self.wthetav

    @property
    def dthetav(self) -> float:
        """Virtual temperature jump at h [K]."""
        return (self.theta + self.dtheta) * (
            1.0 + 0.61 * (self.q + self.dq)
        ) - self.theta * (1.0 + 0.61 * self.q)

    @property
    def wthetav(self) -> float:
        """Surface kinematic virtual heat flux [K m s-1]."""
        return (
            self._cfg["mixedLayer"]["wtheta"]
            + 0.61 * self.theta * self._cfg["mixedLayer"]["wq"]
        )
