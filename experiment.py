"""Social learning of spite experiment. Played with one player only + a bot."""

from dallinger.networks import FullyConnected
from dallinger.experiment import Experiment

import json


class Spite(Experiment):
    """Define the structure of the experiment."""

    def __init__(self, session=None):

        super(Spite, self).__init__(session)
        from . import models

        self.models = models
        self.experiment_repeats = 1  # How many networks?
        self.initial_recruitment_size = self.experiment_repeats  # How many participants? (note, it is always 1 per group)
        self.known_classes = {
            "Donation": models.Donation,
            "Reduction": models.Reduction,
            "Condition": models.Condition,
            "Drop" : models.Drop,
            "Feedback" : models.Feedback
        }

        if session:
            self.setup()

    def setup(self):
        """Runs only if there are no networks."""

        if not self.networks():
            super(Spite, self).setup()
            for net in self.networks():
                self.models.Pogtwo(network=net)

    def create_network(self):
        """Return a new network."""
        return FullyConnected(max_size=2)  # 1 Pog, 1 Participant

    def get_network_for_participant(self, participant):
        if participant.nodes():
            return None
        else:
            return self.networks(full=False)[0]

    def create_node(self, participant, network):
        """Create a Probe for the participant"""
        node = self.models.Probe(network=network, participant=participant)
        node.score_in_pgg = 0
        return node

    def bonus(self, participant):
        """Calculate a participants bonus."""
        node = participant.nodes()[0]
        return min(round(node.score_in_pgg * 0.0075, 2), 0.60)  # Each point is worth 0.0075 cents. Maximum of 1 dollar can be earned overall

    def info_post_request(self, node, info):
        """Depending on the info type, different things will happen here."""
        pog = node.network.nodes(type=self.models.Pogtwo)[0]

        if node.failed:
            raise ValueError("Node {} is failed, it should not be making infos".format(node.id))

        if info.type == "Donation":
            node.transmit(what=info, to_whom=self.models.Pogtwo)[0]
            pog.receive()

        elif info.type == "Condition":
            if info.contents in ["Asocial", "Conspite", "Conalt", "Connothing", "Topspite", "Topalt", "Topnothing"]:
                node.condition = info.contents
            else:
                node.Partnerscore = info.contents

        if info.type == "Reduction":
            node.score_in_pgg = (int(node.score_in_pgg) - abs(int(info.contents)));
