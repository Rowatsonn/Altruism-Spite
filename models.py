from dallinger.models import Node, Info
import random
import json


def bound(x, lower, upper):
    return max(min(x, upper), lower)


class Probe(Node):
    """ Just a node, but it needed a name. Also has a score property."""

    __mapper_args__ = {
        "polymorphic_identity": "Probe_node"
    }

    @property
    def score_in_pgg(self):
        return int(self.property1)

    @property
    def condition(self):
        return self.property2

    @property
    def Partnerscore(self):
        return int(self.property3)

    @score_in_pgg.setter
    def score_in_pgg(self, val):
        self.property1 = int(val)

    @condition.setter
    def condition(self, val):
        self.property2 = val

    @Partnerscore.setter
    def Partnerscore(self, val):
        self.property3 = int(val)


class Pogtwo(Node):
    """Version two of the pot of greed. Handles some experiment backend."""

    __mapper_args__ = {
        "polymorphic_identity": "pot_of_greed_bot"
    }

    def update(self, infos):
        """This will handle working out the scores. Infos end up here whenever .receieve()
        is called in the backend"""
        node = infos[0].origin
        node_donation = int(infos[0].contents)
        pog_donation = round(bound(((node_donation/2)*1.5) + random.randint(-3, 3), 0, 12),0)
        total_earnings = (10 - node_donation) + pog_donation
        node.score_in_pgg = node.score_in_pgg + (10 - node_donation) + pog_donation

        summary = {
            'total_earnings': total_earnings,
            'pog_donation': pog_donation,
            'node_donation': node_donation,
            'score_in_pgg': node.score_in_pgg
        }
        self.transmit(what=Info(origin=self, contents=json.dumps(summary)))


class Donation(Info):
    """Info submitted when the participant is playing the PGG."""

    __mapper_args__ = {"polymorphic_identity": "Donation"}


class Reduction(Info):
    """Info submitted when the participant chooses whether to be spiteful"""

    __mapper_args__ = {"polymorphic_identity": "Reduction"}


class Condition(Info):
    """Info submitted when the participant generates their experimental condition"""

    __mapper_args__ = {"polymorphic_identity": "Condition"}

class Drop(Info):
    """Info created when a participant decides they wish to drop out"""

    __mapper_args__ = {"polymorphic_identity": "Drop"}

class Feedback(Info):
    """Info created by the follow up page"""

    __mapper_args__ = {"polymorphic_identity": "Feedback"}
